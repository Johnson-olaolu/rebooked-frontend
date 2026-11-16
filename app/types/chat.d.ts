import type { BookCondition, BookStatus } from "./book";
import type { INotification } from "./notification";
import type { ISellerProfile } from "./user";

/** Mirrors API_CHANGES #18. One conversation per pair of users; books are attached to it. */

export type ConversationFilter = "ALL" | "UNREAD" | "SELLING" | "BUYING";

/** How an attached book stands in this conversation. */
export type ConversationBookState = "OPEN" | "SOLD_TO_BUYER" | "SOLD_ELSEWHERE" | "UNAVAILABLE";

export type MessageType = "TEXT" | "SYSTEM";

export type SystemEvent = "BOOK_ADDED" | "SOLD_TO_BUYER" | "SOLD_ELSEWHERE" | "BOOK_UNAVAILABLE" | "BOOK_AVAILABLE";

export interface IConversationBook {
  bookId: string;
  title: string;
  coverUrl?: string | null;
  price?: number | null;
  isFree?: boolean;
  condition?: BookCondition | null;
  /** Live book status; null once the book has been removed. */
  status?: BookStatus | null;
  state: ConversationBookState;
  /** From the viewer's point of view. */
  role: "SELLER" | "BUYER";
  addedAt: string;
  lastMessageAt?: string | null;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  bookId?: string | null;
  type: MessageType;
  body?: string | null;
  systemEvent?: SystemEvent | null;
  clientId?: string | null;
  createdAt: string;
}

export interface ILastMessage {
  id: string;
  preview: string;
  senderId: string;
  bookId?: string | null;
  type: MessageType;
  createdAt: string;
}

export interface IConversation {
  id: string;
  other: ISellerProfile;
  books: IConversationBook[];
  lastMessage?: ILastMessage | null;
  unread: number;
  otherLastReadMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IConversationPage {
  content: IConversation[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  counts: Record<ConversationFilter, number>;
}

export interface IMessagePage {
  /** Newest first. */
  content: IMessage[];
  hasMore: boolean;
}

export interface IConversationWith {
  conversationId: string;
  hasBook: boolean;
}

/** A message the user has written that the server hasn't acknowledged yet. */
export interface IPendingMessage {
  clientId: string;
  conversationId: string;
  bookId?: string | null;
  body: string;
  createdAt: string;
  failed?: string;
}

export type ChatErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "OWN_BOOK"
  | "BOOK_NOT_AVAILABLE"
  | "TOKEN_EXPIRED"
  | "SERVER"
  | "TIMEOUT"
  | "OFFLINE";

/** Events on `/user/queue/events`. */
export type ChatEvent =
  | { type: "ack"; clientId: string; data: unknown }
  | { type: "message"; conversationId: string; message: IMessage; conversation: IConversation }
  | { type: "read"; conversationId: string; userId: string; upToMessageId: string; readAt?: string }
  | { type: "conversation"; conversation: IConversation }
  | { type: "error"; clientId?: string; code: ChatErrorCode; message: string; errors?: Record<string, string> }
  // Notifications share the queue (API_CHANGES #19c).
  | { type: "notification"; notification: INotification; unreadTotal?: number }
  | { type: "notification.read"; ids?: string[]; all?: boolean; unreadTotal?: number };
