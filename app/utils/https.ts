import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getBaseStore } from "~/store/store";
import type { IErrorResponse, IResponse } from "~/types/api";
import type { ILoginResponse } from "~/types/auth";
import type { IDelete, IGet, IPatch, IPost, IPut } from "~/types/https";

export const BASE_URL = import.meta.env.VITE_BASE_URL as string;

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Refresh this long before the access token's stated expiry. */
const EXPIRY_SKEW_MS = 30 * 1000;

const isAuthUrl = (url?: string) => !!url && url.startsWith("/auth/");

class HttpFacade {
  private http: AxiosInstance;
  /** Shared so concurrent requests trigger a single refresh (refresh tokens rotate). */
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      headers: { "content-type": "application/json" },
    });

    this.http.interceptors.request.use(async (config) => {
      const { accessToken, refreshToken, accessTokenExpiresAt } = getBaseStore().getState();
      let token = accessToken;

      // Refresh proactively: some routes (e.g. /user/me) answer an expired token
      // with a non-401 error, so waiting for a 401 isn't enough.
      const expired = !!accessTokenExpiresAt && Date.now() > accessTokenExpiresAt - EXPIRY_SKEW_MS;
      if (token && refreshToken && expired && !isAuthUrl(config.url)) {
        token = await this.refreshOrLogout();
      }

      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.http.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableConfig | undefined;
        if (
          error.response?.status !== 401 ||
          !originalRequest ||
          originalRequest._retry ||
          isAuthUrl(originalRequest.url) ||
          !getBaseStore().getState().refreshToken
        ) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        const token = await this.refreshOrLogout();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return this.http(originalRequest);
      },
    );
  }

  /**
   * A usable access token for the chat socket: refreshed first when it's about to expire, or always
   * when `force` (the server said it expired). Shares the in-flight refresh with HTTP requests.
   */
  freshToken = async (force = false): Promise<string | undefined> => {
    const { accessToken, refreshToken, accessTokenExpiresAt } = getBaseStore().getState();
    if (!accessToken) return undefined;
    const expired = !!accessTokenExpiresAt && Date.now() > accessTokenExpiresAt - EXPIRY_SKEW_MS;
    if (refreshToken && (force || expired)) return this.refreshOrLogout();
    return accessToken;
  };

  /** Refreshes the token pair; on failure logs out and sends the user to /login. */
  private refreshOrLogout(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken()
        .catch((refreshError) => {
          getBaseStore().getState().logout();
          if (typeof window !== "undefined") {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
          throw refreshError;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  /** Exchanges the stored refresh token for a new token pair. */
  private async refreshAccessToken(): Promise<string> {
    const { refreshToken, setTokens } = getBaseStore().getState();
    if (!refreshToken) throw new Error("No refresh token");

    const response = await axios.post<IResponse<ILoginResponse>>(`${BASE_URL}/auth/refresh-token`, { refreshToken });
    const { token, refreshToken: nextRefreshToken, expiresIn } = response.data.data;
    setTokens({ accessToken: token, refreshToken: nextRefreshToken, expiresIn });
    return token;
  }

  get = async ({ url, query = {} }: IGet) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, String(value));
    });
    const queryString = params.toString();
    const response = await this.http.get(queryString ? `${url}?${queryString}` : url);
    return response.data;
  };

  post = async ({ url, body, headers = {} }: IPost) => {
    const response = await this.http.post(url, body, { headers });
    return response.data;
  };

  patch = async ({ url, body, headers = {} }: IPatch) => {
    const response = await this.http.patch(url, body, { headers });
    return response.data;
  };

  put = async ({ url, body, headers = {} }: IPut) => {
    const response = await this.http.put(url, body, { headers });
    return response.data;
  };

  delete = async ({ url, body }: IDelete) => {
    const response = await this.http.delete(url, { data: body });
    return response.data;
  };
}

export default new HttpFacade();

const asErrorBody = (error: unknown): Partial<IErrorResponse> | undefined => {
  if (axios.isAxiosError(error)) return error.response?.data as Partial<IErrorResponse> | undefined;
  return undefined;
};

/** HTTP status of a failed request, if there was a response. */
export const getErrorStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;

/** Human-readable message from an API error (`{ status, message, errors? }`). */
export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (axios.isAxiosError(error) && !error.response) return "Can't reach Rebooked right now. Check your connection.";
  const message = asErrorBody(error)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
};

/** Field-level validation messages, keyed by field path (e.g. `password`, `address.city`). */
export const getFieldErrors = (error: unknown): Record<string, string> => asErrorBody(error)?.errors ?? {};
