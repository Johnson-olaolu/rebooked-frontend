"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useBaseStore } from "~/hooks/store";
import { chatKeys, insertMessage, upsertConversation } from "~/hooks/useChat";
import { applyRead, upsertNotification } from "~/hooks/useNotifications";
import chatSocket from "~/lib/chatSocket";
import type { IConversation } from "~/types/chat";
import { notificationText, presentNotification } from "~/utils/notification";
import { displayName } from "~/utils/text";

/**
 * Keeps the socket connected while someone is logged in, and writes what it pushes into the query
 * cache so the inbox, open thread, notifications and badges update live (API_CHANGES #18e, #19c).
 */
const ChatConnection = () => {
  const queryClient = useQueryClient();
  const loggedIn = useBaseStore((state) => !!state.accessToken && !!state.user);
  const userId = useBaseStore((state) => state.user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  // Read inside the event handler without resubscribing on every navigation.
  const here = useRef(location.pathname);
  here.current = location.pathname;
  const go = useRef(navigate);
  go.current = navigate;

  useEffect(() => {
    if (loggedIn) chatSocket.start();
    else void chatSocket.stop();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || !userId) return;
    return chatSocket.onEvent((event) => {
      switch (event.type) {
        case "message": {
          const threadPath = `/dashboard/messages/${event.conversationId}`;
          // The open thread marks new messages read itself, so don't flash an unread count for it.
          const watching = here.current === threadPath && document.visibilityState === "visible";
          insertMessage(queryClient, event.message);
          upsertConversation(queryClient, watching ? { ...event.conversation, unread: 0 } : event.conversation);
          const fromOther = event.message.senderId !== userId && event.message.type === "TEXT";
          if (fromOther && !watching) {
            void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
            // A quiet heads-up when you're elsewhere in the app.
            const name = displayName(event.conversation.other?.userName) || "Someone";
            toast(`${name}: ${event.message.body ?? ""}`.slice(0, 120), {
              id: `chat-${event.conversationId}`,
              action: { label: "Open", onClick: () => go.current(threadPath) },
            });
          }
          break;
        }
        case "read": {
          const patch = (data?: IConversation) => {
            if (!data) return data;
            return event.userId === userId
              ? { ...data, unread: 0 } // read in another tab
              : { ...data, otherLastReadMessageId: event.upToMessageId };
          };
          queryClient.setQueryData<IConversation>(chatKeys.conversation(event.conversationId), patch);
          if (event.userId === userId) void queryClient.invalidateQueries({ queryKey: chatKeys.unread });
          break;
        }
        case "conversation": {
          upsertConversation(queryClient, event.conversation);
          // A book in it changed state (sold, archived, back on the shelf): its system line is in the thread.
          for (const book of event.conversation.books) {
            void queryClient.invalidateQueries({ queryKey: ["book", book.bookId] });
          }
          break;
        }
        case "notification": {
          upsertNotification(queryClient, event.notification, event.unreadTotal);
          // Chat already pops up for messages; everything else gets a quiet heads-up unless you're on the page.
          if (event.notification.type !== "NEW_MESSAGES" && here.current !== "/dashboard/notifications") {
            const { to } = presentNotification(event.notification);
            toast(notificationText(event.notification), {
              id: `notification-${event.notification.id}`,
              action: { label: "View", onClick: () => go.current(to) },
            });
          }
          break;
        }
        case "notification.read":
          applyRead(queryClient, event.all ? "all" : (event.ids ?? []), event.unreadTotal);
          break;
        default:
          break;
      }
    });
  }, [loggedIn, userId, queryClient]);

  return null;
};

export default ChatConnection;
