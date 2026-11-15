import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import chatSocket, { ChatError, newClientId, type ChatStatus } from "~/lib/chatSocket";
import chatService from "~/services/chat.service";
import type {
  ConversationFilter,
  IConversation,
  IConversationPage,
  IMessage,
  IMessagePage,
  IPendingMessage,
} from "~/types/chat";
import { useBaseStore } from "./store";

/* ----------------------------------------------------------------------------------------------
 * Query keys and cache helpers. Socket events and acks write into these so every screen (inbox,
 * thread, badges) stays live without refetching.
 * -------------------------------------------------------------------------------------------- */

export const chatKeys = {
  lists: ["conversations"] as const,
  list: (filter: ConversationFilter, search: string) => ["conversations", filter, search] as const,
  conversation: (id: string) => ["conversation", id] as const,
  messages: (id: string) => ["conversation", id, "messages"] as const,
  pending: (id: string) => ["conversation", id, "pending"] as const,
  unread: ["chat-unread"] as const,
  withBook: (bookId: string) => ["conversation-with", bookId] as const,
  withUser: (userId: string) => ["conversation-with", "user", userId] as const,
};

type MessagesData = InfiniteData<IMessagePage, string | undefined>;
type ListData = InfiniteData<IConversationPage, number>;

/** Adds a confirmed message to a loaded thread (newest-first pages), once. */
export const insertMessage = (queryClient: QueryClient, message: IMessage) => {
  queryClient.setQueryData<MessagesData>(chatKeys.messages(message.conversationId), (data) => {
    if (!data) return data;
    if (data.pages.some((page) => page.content.some((item) => item.id === message.id))) return data;
    const [first, ...rest] = data.pages;
    return { ...data, pages: [{ ...first, content: [message, ...first.content] }, ...rest] };
  });
  if (message.clientId) removePending(queryClient, message.conversationId, message.clientId);
};

/** Puts a conversation's latest summary into the detail cache and every loaded inbox list. */
export const upsertConversation = (queryClient: QueryClient, conversation: IConversation) => {
  queryClient.setQueryData(chatKeys.conversation(conversation.id), conversation);
  queryClient.setQueriesData<ListData>({ queryKey: chatKeys.lists }, (data) => {
    if (!data) return data;
    const pages = data.pages.map((page) => ({ ...page, content: page.content.filter((row) => row.id !== conversation.id) }));
    const wasThere = pages.some((page, index) => page.content.length !== data.pages[index].content.length);
    // Move it to the top (latest activity first). A conversation that isn't in this list yet is left to
    // the refetch below, which knows which filters it belongs under.
    if (!wasThere || !pages.length) return data;
    pages[0] = { ...pages[0], content: [conversation, ...pages[0].content] };
    return { ...data, pages };
  });
  void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
};

const setPending = (
  queryClient: QueryClient,
  conversationId: string,
  change: (list: IPendingMessage[]) => IPendingMessage[],
) => queryClient.setQueryData<IPendingMessage[]>(chatKeys.pending(conversationId), (list = []) => change(list));

const removePending = (queryClient: QueryClient, conversationId: string, clientId: string) =>
  setPending(queryClient, conversationId, (list) => list.filter((item) => item.clientId !== clientId));

const errorText = (error: unknown) =>
  error instanceof ChatError ? (error.errors?.body ?? error.message) : "Couldn't send. Try again.";

/* ----------------------------------------------------------------------------------------------
 * Hooks
 * -------------------------------------------------------------------------------------------- */

export const useChatStatus = (): ChatStatus =>
  useSyncExternalStore(
    (onChange) => chatSocket.onStatus(onChange),
    () => chatSocket.getStatus(),
    () => "idle",
  );

/** Total unread messages, for nav badges. Live via the socket; polls while it's down. */
export const useUnreadCount = () => {
  const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);
  const status = useChatStatus();
  const { data } = useQuery({
    queryKey: chatKeys.unread,
    queryFn: () => chatService.unreadCount().then((response) => response.data?.total ?? 0),
    enabled: loggedIn,
    staleTime: 30_000,
    refetchInterval: status === "live" ? false : 60_000,
    retry: false,
  });
  return loggedIn ? (data ?? 0) : 0;
};

export const useConversations = (filter: ConversationFilter, search: string) =>
  useInfiniteQuery({
    queryKey: chatKeys.list(filter, search),
    queryFn: ({ pageParam }) => chatService.list({ filter, search, page: pageParam, pageSize: 30 }).then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    placeholderData: (previous) => previous,
  });

export const useConversation = (id: string) =>
  useQuery({
    queryKey: chatKeys.conversation(id),
    queryFn: () => chatService.get(id).then((response) => response.data),
    enabled: !!id,
    retry: (count, error) => !/40[034]/.test(String((error as { response?: { status?: number } })?.response?.status)) && count < 1,
  });

export const useMessages = (id: string) =>
  useInfiniteQuery({
    queryKey: chatKeys.messages(id),
    queryFn: ({ pageParam }) => chatService.messages(id, pageParam).then((response) => response.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.content.at(-1)?.id : undefined),
    enabled: !!id,
    // Live updates come over the socket; don't refetch (and reshuffle pages) on focus.
    staleTime: Infinity,
  });

export const usePendingMessages = (id: string) =>
  useQuery({
    queryKey: chatKeys.pending(id),
    queryFn: () => [] as IPendingMessage[],
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!id,
  }).data ?? [];

/** The caller's conversation with this book's seller, if any. */
export const useConversationWith = (bookId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: chatKeys.withBook(bookId ?? ""),
    queryFn: () => chatService.withBook(bookId!).then((response) => response.data ?? null),
    enabled: !!bookId && enabled,
    retry: false,
  });

/** The caller's conversation with this user, if any (seller page). */
export const useConversationWithUser = (userId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: chatKeys.withUser(userId ?? ""),
    queryFn: () => chatService.withUser(userId!).then((response) => response.data ?? null),
    enabled: !!userId && enabled,
    retry: false,
  });

export const useChatActions = () => {
  const queryClient = useQueryClient();

  const deliver = useCallback(
    (pending: IPendingMessage) => {
      chatSocket
        .send<IMessage>("/app/message.send", {
          clientId: pending.clientId,
          conversationId: pending.conversationId,
          bookId: pending.bookId ?? undefined,
          body: pending.body,
        })
        .then((message) => {
          if (message?.id) insertMessage(queryClient, { ...message, clientId: message.clientId ?? pending.clientId });
          removePending(queryClient, pending.conversationId, pending.clientId);
        })
        .catch((error) =>
          setPending(queryClient, pending.conversationId, (list) =>
            list.map((item) => (item.clientId === pending.clientId ? { ...item, failed: errorText(error) } : item)),
          ),
        );
    },
    [queryClient],
  );

  /** Shows the message straight away and sends it; failures stay in the thread with Retry. */
  const sendMessage = useCallback(
    (conversationId: string, body: string, bookId?: string | null) => {
      const pending: IPendingMessage = {
        clientId: newClientId(),
        conversationId,
        bookId,
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };
      setPending(queryClient, conversationId, (list) => [...list, pending]);
      deliver(pending);
    },
    [deliver, queryClient],
  );

  const retry = useCallback(
    (pending: IPendingMessage) => {
      setPending(queryClient, pending.conversationId, (list) =>
        list.map((item) => (item.clientId === pending.clientId ? { ...item, failed: undefined } : item)),
      );
      deliver({ ...pending, failed: undefined });
    },
    [deliver, queryClient],
  );

  const discard = useCallback(
    (pending: IPendingMessage) => removePending(queryClient, pending.conversationId, pending.clientId),
    [queryClient],
  );

  /** Opens (or reuses) the conversation with this book's seller, optionally with a first message. */
  const startConversation = useCallback(
    async (bookId: string, body?: string) => {
      const conversation = await chatSocket.send<IConversation>("/app/conversation.start", {
        clientId: newClientId(),
        bookId,
        body: body?.trim() || undefined,
      });
      upsertConversation(queryClient, conversation);
      queryClient.setQueryData(chatKeys.withBook(bookId), { conversationId: conversation.id, hasBook: true });
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversation.id) });
      return conversation;
    },
    [queryClient],
  );

  const markRead = useCallback(
    (conversationId: string, upToMessageId: string) => {
      queryClient.setQueryData<IConversation>(chatKeys.conversation(conversationId), (data) =>
        data ? { ...data, unread: 0 } : data,
      );
      queryClient.setQueriesData<ListData>({ queryKey: chatKeys.lists }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                content: page.content.map((row) => (row.id === conversationId ? { ...row, unread: 0 } : row)),
              })),
            }
          : data,
      );
      chatSocket
        .send<{ unreadTotal?: number }>("/app/conversation.read", { clientId: newClientId(), conversationId, upToMessageId })
        .then((ack) => {
          if (typeof ack?.unreadTotal === "number") queryClient.setQueryData(chatKeys.unread, ack.unreadTotal);
          else void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
          // A list refetch that started before the server recorded the read would still show it unread.
          void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
        })
        .catch(() => undefined);
    },
    [queryClient],
  );

  /** Seller only: the book becomes Sold, recorded against the other person in this conversation. */
  const markSoldToBuyer = useCallback(
    async (conversationId: string, bookId: string) => {
      const conversation = await chatSocket.send<IConversation>("/app/book.sold", {
        clientId: newClientId(),
        conversationId,
        bookId,
      });
      if (conversation?.id) upsertConversation(queryClient, conversation);
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      void queryClient.invalidateQueries({ queryKey: ["shelf"] });
      void queryClient.invalidateQueries({ queryKey: ["shop"] });
      return conversation;
    },
    [queryClient],
  );

  return { sendMessage, retry, discard, startConversation, markRead, markSoldToBuyer };
};
