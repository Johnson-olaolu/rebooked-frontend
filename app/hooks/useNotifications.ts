import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback } from "react";
import chatSocket, { newClientId } from "~/lib/chatSocket";
import notificationService from "~/services/notification.service";
import type { INotification, INotificationPage, INotificationPreference, IPreferenceChange, NotificationFilter } from "~/types/notification";
import { getErrorMessage } from "~/utils/https";
import { useBaseStore } from "./store";
import { useChatStatus } from "./useChat";

/* Query keys and cache helpers. Socket events (ChatConnection) write into these. */

export const notificationKeys = {
  lists: ["notifications"] as const,
  list: (filter: NotificationFilter) => ["notifications", filter] as const,
  unread: ["notifications-unread"] as const,
  preferences: ["notification-preferences"] as const,
};

type ListData = InfiniteData<INotificationPage, number>;

export const isRead = (notification: INotification) => !!notification.readAt || !!notification.read;

/** A new notification, or a grouped one that took another message: move it to the top of every list. */
export const upsertNotification = (queryClient: QueryClient, notification: INotification, unreadTotal?: number) => {
  queryClient.setQueriesData<ListData>({ queryKey: notificationKeys.lists }, (data) => {
    if (!data?.pages.length) return data;
    const pages = data.pages.map((page) => ({
      ...page,
      content: page.content.filter((item) => item.id !== notification.id),
    }));
    pages[0] = { ...pages[0], content: [notification, ...pages[0].content] };
    return { ...data, pages };
  });
  if (typeof unreadTotal === "number") queryClient.setQueryData(notificationKeys.unread, unreadTotal);
  else void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
};

/** Marks rows read in every cached list (`all` = everything). */
export const applyRead = (queryClient: QueryClient, ids: string[] | "all", unreadTotal?: number) => {
  const now = new Date().toISOString();
  const wanted = ids === "all" ? null : new Set(ids);
  queryClient.setQueriesData<ListData>({ queryKey: notificationKeys.lists }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            content: page.content.map((item) =>
              !isRead(item) && (!wanted || wanted.has(item.id)) ? { ...item, read: true, readAt: now } : item,
            ),
          })),
        }
      : data,
  );
  if (typeof unreadTotal === "number") queryClient.setQueryData(notificationKeys.unread, unreadTotal);
};

/* Hooks */

/** Unread notifications, for the bell and menu badges. Live via the socket; polls while it's down. */
export const useNotificationUnread = () => {
  const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);
  const status = useChatStatus();
  const { data } = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationService.unreadCount().then((response) => response.data?.total ?? 0),
    enabled: loggedIn,
    staleTime: 30_000,
    refetchInterval: status === "live" ? false : 60_000,
    retry: false,
  });
  return loggedIn ? (data ?? 0) : 0;
};

export const useNotifications = (filter: NotificationFilter, pageSize = 30, enabled = true) =>
  useInfiniteQuery({
    queryKey: [...notificationKeys.list(filter), pageSize],
    queryFn: ({ pageParam }) => notificationService.list({ filter, page: pageParam, pageSize }).then((response) => response.data),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    enabled,
  });

/** Marks some (or all) notifications read: instantly in the UI, then over the socket. */
export const useMarkNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (ids: string[] | "all") => {
      if (ids !== "all" && ids.length === 0) return;
      const before = queryClient.getQueryData<number>(notificationKeys.unread) ?? 0;
      applyRead(queryClient, ids, ids === "all" ? 0 : Math.max(0, before - ids.length));
      chatSocket
        .send<{ unreadTotal?: number }>("/app/notification.read", {
          clientId: newClientId(),
          ...(ids === "all" ? { all: true } : { ids }),
        })
        .then((ack) => {
          if (typeof ack?.unreadTotal === "number") queryClient.setQueryData(notificationKeys.unread, ack.unreadTotal);
        })
        .catch(() => {
          // Couldn't reach the server: put the real state back.
          void queryClient.invalidateQueries({ queryKey: notificationKeys.lists });
          void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
        });
    },
    [queryClient],
  );
};

/* Settings */

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: () => notificationService.preferences().then((response) => response.data ?? []),
  });

const applyChange = (list: INotificationPreference[] | undefined, change: IPreferenceChange) =>
  list?.map((item) =>
    item.type === change.type ? { ...item, channels: { ...item.channels, [change.channel]: change.enabled } } : item,
  );

/** Flips one switch straight away, then saves it. Puts it back if the save fails. */
export const useUpdateNotificationPreference = () => {
  const queryClient = useQueryClient();
  const mutationKey = ["notification-preference"];
  return useMutation({
    mutationKey,
    mutationFn: (change: IPreferenceChange) => notificationService.updatePreference(change).then((response) => response.data),
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences });
      queryClient.setQueryData<INotificationPreference[]>(notificationKeys.preferences, (list) => applyChange(list, change));
    },
    onSuccess: (list) => {
      // Only take the server's list when no other switch is still saving, so it can't undo a newer flip.
      if (list && queryClient.isMutating({ mutationKey }) === 1) queryClient.setQueryData(notificationKeys.preferences, list);
    },
    onError: (error, change) => {
      queryClient.setQueryData<INotificationPreference[]>(notificationKeys.preferences, (list) =>
        applyChange(list, { ...change, enabled: !change.enabled }),
      );
      toast.error(getErrorMessage(error, "We couldn't save that. Try again."));
    },
  });
};
