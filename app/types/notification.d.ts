/** Mirrors API_CHANGES #19 and rebooked-backend/docs/notification.md (in-app types only). */

export type NotificationType =
  | "BOOK_ENQUIRY"
  | "SOLD_TO_YOU"
  | "SOLD_ELSEWHERE"
  | "BOOK_UNAVAILABLE"
  | "BOOK_AVAILABLE"
  | "NEW_MESSAGES"
  | "STALE_LISTING"
  | "DRAFT_REMINDER"
  | "WELCOME"
  | "MARK_AS_SOLD_NUDGE"
  | "VIEWS_MILESTONE"
  | "RATE_SELLER";

export type NotificationFilter = "ALL" | "UNREAD";

export interface INotification {
  id: string;
  type: NotificationType;
  actor?: { id: string; userName?: string | null; profilePictureUrl?: string | null } | null;
  book?: { id: string; title: string; coverUrl?: string | null; slug?: string | null } | null;
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

/* Settings (GET/PATCH /notification/preferences). Covers every type the user can turn off, email-only ones included. */

export type NotificationChannel = "IN_APP" | "EMAIL";

export type NotificationCategory = "ACCOUNT" | "CHAT" | "SALES" | "LISTINGS";

export interface INotificationPreference {
  /** A NotificationType, or an email-only type such as UNREPLIED_MESSAGE. */
  type: string;
  category: NotificationCategory;
  /** Only the channels this type is sent on; true = on. */
  channels: Partial<Record<NotificationChannel, boolean>>;
}

export interface IPreferenceChange {
  type: string;
  channel: NotificationChannel;
  enabled: boolean;
}
