import { BadgeCheck, BookX, CircleHelp, Clock, Eye, FilePenLine, Hand, MessageCircle, MessageSquareText, PackageCheck, RotateCcw, type LucideIcon } from "lucide-react";
import type { INotification, NotificationType } from "~/types/notification";
import { threadPath } from "./chat";
import { displayName } from "./text";

/** A piece of notification text: plain, a person (bold) or a book title (serif italics). */
export type Segment = string | { person: string } | { book: string };

interface Presented {
  icon: LucideIcon;
  segments: Segment[];
  /** Extra line under the text (NEW_MESSAGES preview). */
  detail?: string;
  to: string;
}

const book = (n: INotification): Segment => ({ book: n.book?.title?.trim() || "a book" });
const person = (n: INotification): Segment => ({ person: displayName(n.actor?.userName).split(" ")[0] || "Someone" });
const thread = (n: INotification) => (n.conversationId ? threadPath(n.conversationId, n.book?.id) : "/dashboard/messages");
const bookPage = (n: INotification) => (n.book?.id ? `/book/${n.book.id}` : "/shop");
const editBook = (n: INotification) => (n.book?.id ? `/dashboard/shelf/${n.book.id}/edit` : "/dashboard/shelf");

/** The backend sends the milestone as preview text ("100 views"). */
const viewsFrom = (n: INotification) => {
  const views = Number.parseInt(n.preview ?? "", 10);
  return Number.isFinite(views) ? views.toLocaleString() : "lots of";
};

const PRESENT: Record<NotificationType, (n: INotification) => Presented> = {
  BOOK_ENQUIRY: (n) => ({
    icon: MessageCircle,
    segments: [person(n), " asked about ", book(n)],
    detail: n.preview ?? undefined,
    to: thread(n),
  }),
  SOLD_TO_YOU: (n) => ({ icon: BadgeCheck, segments: [person(n), " marked ", book(n), " as sold to you"], to: thread(n) }),
  SOLD_ELSEWHERE: (n) => ({ icon: PackageCheck, segments: [book(n), " was sold to someone else"], to: thread(n) }),
  BOOK_UNAVAILABLE: (n) => ({ icon: BookX, segments: [book(n), " is no longer available"], to: thread(n) }),
  BOOK_AVAILABLE: (n) => ({ icon: RotateCcw, segments: [book(n), " is back on the shelf"], to: bookPage(n) }),
  NEW_MESSAGES: (n) => {
    const count = Math.max(1, n.count ?? 1);
    return {
      icon: MessageSquareText,
      segments: [person(n), count === 1 ? " sent you a message" : ` sent you ${count} messages`],
      detail: n.preview ?? undefined,
      to: thread(n),
    };
  },
  STALE_LISTING: (n) => ({
    icon: Clock,
    segments: [book(n), " has been on your shelf for 30 days with no enquiries. Still have it? A lower price often helps."],
    to: editBook(n),
  }),
  DRAFT_REMINDER: (n) => ({ icon: FilePenLine, segments: ["Finish adding ", book(n), " to your shelf"], to: editBook(n) }),
  WELCOME: () => ({
    icon: Hand,
    segments: ["Welcome to Rebooked! Add the first book you're done with and buyers can message you about it."],
    to: "/dashboard/shelf/new",
  }),
  MARK_AS_SOLD_NUDGE: (n) => ({
    icon: CircleHelp,
    segments: ["Did ", book(n), " sell? Mark it as sold so buyers stop asking about it."],
    to: editBook(n),
  }),
  VIEWS_MILESTONE: (n) => ({
    icon: Eye,
    segments: [book(n), ` has had ${viewsFrom(n)} views`],
    to: bookPage(n),
  }),
};

export const presentNotification = (notification: INotification): Presented =>
  (PRESENT[notification.type] ?? (() => ({ icon: MessageCircle, segments: ["Something happened on Rebooked"], to: "/dashboard" })))(
    notification,
  );

/** Plain text, for pop-ups and aria labels. */
export const notificationText = (notification: INotification) =>
  presentNotification(notification)
    .segments.map((segment) => (typeof segment === "string" ? segment : "person" in segment ? segment.person : segment.book))
    .join("");

/** Page groups: Today, Yesterday, This week, Earlier. */
export const notificationGroup = (iso: string, now = new Date()) => {
  const start = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((start(now) - start(new Date(iso))) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  return "Earlier";
};
