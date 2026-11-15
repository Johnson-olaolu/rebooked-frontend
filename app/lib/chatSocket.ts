import { Client, ReconnectionTimeMode, type IFrame, type IStompSocket } from "@stomp/stompjs";
import { getBaseStore } from "~/store/store";
import type { ChatErrorCode, ChatEvent } from "~/types/chat";
import https, { BASE_URL } from "~/utils/https";

/**
 * The chat connection (API_CHANGES #18): STOMP over SockJS at `${BASE_URL}/ws`, authenticated on
 * CONNECT with the access token. One private subscription (`/user/queue/events`) carries everything
 * the server pushes. Writes are STOMP SENDs that the server answers with an `ack` or `error` event
 * carrying the same `clientId`; until then the frame is kept and re-sent after a reconnect (the
 * server ignores a `clientId` it has already handled).
 */

export type ChatStatus = "idle" | "connecting" | "live" | "offline";

export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string,
    readonly errors?: Record<string, string>,
  ) {
    super(message);
  }
}

const EVENTS = "/user/queue/events";
const ACK_TIMEOUT_MS = 10_000;
/** Reconnect with a fresh token this long before the current one expires. */
const RENEW_BEFORE_MS = 60_000;

interface Outgoing {
  destination: string;
  body: Record<string, unknown> & { clientId: string };
  resolve: (data: unknown) => void;
  reject: (error: ChatError) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export const newClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

class ChatSocket {
  private client?: Client;
  private status: ChatStatus = "idle";
  private listeners = new Set<(event: ChatEvent) => void>();
  private statusListeners = new Set<(status: ChatStatus) => void>();
  private outgoing = new Map<string, Outgoing>();
  private renewTimer?: ReturnType<typeof setTimeout>;
  private forceRefresh = false;

  getStatus = () => this.status;

  onEvent(listener: (event: ChatEvent) => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  onStatus(listener: (status: ChatStatus) => void) {
    this.statusListeners.add(listener);
    return () => void this.statusListeners.delete(listener);
  }

  /** Connects (idempotent). Call when a user is logged in. */
  start() {
    if (this.client || typeof window === "undefined") return;
    const client = new Client({
      webSocketFactory: () => this.createSocket(),
      reconnectDelay: 1_000,
      maxReconnectDelay: 30_000,
      heartbeatIncoming: 20_000,
      heartbeatOutgoing: 20_000,
      beforeConnect: async () => {
        // Retries after a drop stay "offline" (the UI keeps saying so) until we're actually back.
        if (this.status !== "offline") this.setStatus("connecting");
        const token = await https.freshToken(this.forceRefresh).catch(() => undefined);
        this.forceRefresh = false;
        if (!token) {
          // Logged out (or the refresh failed and the user is being sent to /login).
          void this.stop();
          return;
        }
        client.connectHeaders = { Authorization: `Bearer ${token}` };
        this.scheduleRenewal();
      },
      onConnect: () => {
        client.subscribe(EVENTS, (frame) => this.handle(frame.body));
        this.setStatus("live");
        // Anything written while offline, or sent but never acknowledged, goes (again) now.
        for (const item of this.outgoing.values()) this.transmit(item);
      },
      onStompError: (frame: IFrame) => {
        // The server refused CONNECT (usually an expired or invalid token): refresh before retrying.
        if (/expired|jwt|token|auth/i.test(`${frame.headers.message ?? ""} ${frame.body}`)) this.forceRefresh = true;
        this.setStatus("offline");
      },
      onWebSocketClose: () => {
        if (this.client) this.setStatus("offline");
      },
    });
    client.reconnectTimeMode = ReconnectionTimeMode.EXPONENTIAL;
    this.client = client;
    // After wifi drops or the laptop sleeps the old socket can be dead without anyone noticing (unless
    // the server sends heartbeats), so start a fresh connection as soon as the browser is back online.
    window.addEventListener("online", this.onOnline);
    this.setStatus("connecting");
    void loadSockJS()
      .then(() => {
        if (this.client === client) client.activate();
      })
      .catch(() => this.setStatus("offline"));
  }

  private onOnline = () => this.reconnect();

  /** Disconnects and fails anything still waiting. Call on logout. */
  async stop() {
    const client = this.client;
    this.client = undefined;
    if (typeof window !== "undefined") window.removeEventListener("online", this.onOnline);
    clearTimeout(this.renewTimer);
    for (const item of this.outgoing.values()) {
      clearTimeout(item.timer);
      item.reject(new ChatError("OFFLINE", "You've been logged out."));
    }
    this.outgoing.clear();
    this.setStatus("idle");
    await client?.deactivate();
  }

  /**
   * Sends a frame and resolves with the server's `ack` data. Rejects with a `ChatError` on an
   * `error` event, or `TIMEOUT` if no answer comes within 10s of being sent.
   */
  send<T = unknown>(destination: string, body: Record<string, unknown> & { clientId: string }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const existing = this.outgoing.get(body.clientId);
      if (existing) clearTimeout(existing.timer);
      const item: Outgoing = { destination, body, resolve: resolve as (data: unknown) => void, reject };
      this.outgoing.set(body.clientId, item);
      if (!this.client) this.start();
      if (this.status === "live") this.transmit(item);
    });
  }

  private transmit(item: Outgoing) {
    if (!this.client?.connected) return;
    clearTimeout(item.timer);
    this.client.publish({ destination: item.destination, body: JSON.stringify(item.body) });
    item.timer = setTimeout(() => {
      this.outgoing.delete(item.body.clientId);
      item.reject(new ChatError("TIMEOUT", "Couldn't send. Check your connection and try again."));
    }, ACK_TIMEOUT_MS);
  }

  private handle(raw: string) {
    let event: ChatEvent;
    try {
      event = JSON.parse(raw) as ChatEvent;
    } catch {
      return;
    }
    if (event.type === "ack" || (event.type === "error" && event.clientId)) {
      const item = this.outgoing.get(event.clientId!);
      if (item) {
        if (event.type === "error" && event.code === "TOKEN_EXPIRED") {
          // Keep the frame; it's re-sent once we're back with a fresh token.
          clearTimeout(item.timer);
          this.reconnect(true);
          return;
        }
        clearTimeout(item.timer);
        this.outgoing.delete(event.clientId!);
        if (event.type === "ack") item.resolve(event.data);
        else item.reject(new ChatError(event.code, event.message, event.errors));
      }
    } else if (event.type === "error" && event.code === "TOKEN_EXPIRED") {
      this.reconnect(true);
    }
    this.listeners.forEach((listener) => listener(event));
  }

  private reconnect(forceRefresh = false) {
    const client = this.client;
    if (!client) return;
    this.forceRefresh = forceRefresh;
    // Dropping the socket makes the client reconnect, running beforeConnect (and the refresh) again.
    client.forceDisconnect();
  }

  private scheduleRenewal() {
    clearTimeout(this.renewTimer);
    const expiresAt = getBaseStore().getState().accessTokenExpiresAt;
    if (!expiresAt) return;
    const wait = Math.max(expiresAt - Date.now() - RENEW_BEFORE_MS, 5_000);
    this.renewTimer = setTimeout(() => this.reconnect(), wait);
  }

  private createSocket(): IStompSocket {
    const SockJS = sockJsConstructor;
    if (!SockJS) throw new Error("SockJS isn't loaded yet");
    // WebSocket, then XHR streaming/polling for networks that block it. The iframe/eventsource
    // transports only matter for very old browsers.
    return new SockJS(`${BASE_URL}/ws`, null, { transports: ["websocket", "xhr-streaming", "xhr-polling"] }) as unknown as IStompSocket;
  }

  private setStatus(status: ChatStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

// sockjs-client's CommonJS entry expects Node's `global`; its browser bundle doesn't. Loaded lazily so
// nothing runs during server rendering.
type SockJSConstructor = new (url: string, reserved?: null, options?: { transports?: string[] }) => WebSocket;
let sockJsConstructor: SockJSConstructor | undefined;
export const loadSockJS = async () => {
  if (!sockJsConstructor) {
    const mod = (await import("sockjs-client/dist/sockjs.min.js")) as { default?: SockJSConstructor };
    sockJsConstructor = (mod.default ?? (mod as unknown as SockJSConstructor)) as SockJSConstructor;
  }
};

const chatSocket = new ChatSocket();
export default chatSocket;
