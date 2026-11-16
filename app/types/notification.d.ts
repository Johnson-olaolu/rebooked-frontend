/** Mirrors API_CHANGES #19. */

export type NotificationType =
  | "BOOK_ENQUIRY"
  | "SOLD_TO_YOU"
  | "SOLD_ELSEWHERE"
  | "BOOK_UNAVAILABLE"
  | "BOOK_AVAILABLE"
  | "NEW_MESSAGES"
  | "STALE_LISTING"
  | "DRAFT_REMINDER";

export type NotificationFilter = "ALL" | "UNREAD";

export interface INotification {
  id: string;
  type: NotificationType;
  actor?: { id: string; userName?: string | null; profilePictureUrl?: string | null } | null;
  book?: { id: string; title: string; coverUrl?: string | null } | null;
  conversationId?: string | null;
  count?: number;
  preview?: string | null;
  read?: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationPage {
  content: INotification[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  unreadTotal: number;
}
