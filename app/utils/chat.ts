import type { IConversation, IConversationBook, IMessage } from "~/types/chat";
import { displayName } from "./text";

export const threadPath = (conversationId: string, bookId?: string) =>
  `/dashboard/messages/${conversationId}${bookId ? `?book=${encodeURIComponent(bookId)}` : ""}`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Inbox times as in the mockup: "Now", "5 m", "19 h", "3 d", "2 w", then a date. */
export const relativeTime = (iso?: string | null, now = Date.now()) => {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const diff = Math.max(0, now - time);
  if (diff < MINUTE) return "Now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} d`;
  if (diff < 5 * 7 * DAY) return `${Math.floor(diff / (7 * DAY))} w`;
  return new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Day separators in a thread: "Today", "Yesterday", "Tuesday", then "12 March 2026". */
export const dayLabel = (iso: string, now = new Date()) => {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-GB", { weekday: "long" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

export const sameDay = (a: string, b: string) => startOfDay(new Date(a)) === startOfDay(new Date(b));

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const firstName = (name?: string | null) => displayName(name).split(" ")[0] || "them";

/** "Buying from you", "You're buying", or both when the deal goes both ways. */
export const roleLine = (conversation: Pick<IConversation, "books">) => {
  const selling = conversation.books.some((book) => book.role === "SELLER");
  const buying = conversation.books.some((book) => book.role === "BUYER");
  if (selling && buying) return "Buying and selling";
  return selling ? "Buying from you" : "You're buying";
};

/** Books in a conversation, most recently discussed first. */
export const sortedBooks = (books: IConversationBook[]) =>
  [...books].sort(
    (a, b) => new Date(b.lastMessageAt ?? b.addedAt).getTime() - new Date(a.lastMessageAt ?? a.addedAt).getTime(),
  );

export const isOpen = (book: IConversationBook) => book.state === "OPEN" && book.status !== "SOLD" && !!book.status;

/** The pill on a book in "Books in this chat". */
export const bookStateLabel = (book: IConversationBook, otherName: string) => {
  switch (book.state) {
    case "SOLD_TO_BUYER":
      return book.role === "BUYER" ? "Sold to you" : `Sold to ${firstName(otherName)}`;
    case "SOLD_ELSEWHERE":
      return book.role === "BUYER" ? "Sold to someone else" : "Sold";
    case "UNAVAILABLE":
      return "No longer available";
    default:
      return book.status === "INACTIVE" ? "Archived" : "Available";
  }
};

export const BOOK_STATE_PILL: Record<IConversationBook["state"], string> = {
  OPEN: "bg-olive/15 text-olive",
  SOLD_TO_BUYER: "bg-primary/12 text-primary",
  SOLD_ELSEWHERE: "bg-foreground/8 text-foreground/60",
  UNAVAILABLE: "bg-foreground/8 text-foreground/60",
};

/** Pieces of a system line; `title` is rendered in italics by the thread. */
export const systemLine = (
  message: IMessage,
  { meId, otherName, bookTitle }: { meId: string; otherName: string; bookTitle: string },
): { before: string; title: string; after: string } => {
  const byMe = message.senderId === meId;
  const name = firstName(otherName);
  switch (message.systemEvent) {
    case "BOOK_ADDED":
      return { before: byMe ? "You asked about " : `${name} asked about `, title: bookTitle, after: "" };
    case "SOLD_TO_BUYER":
      return byMe
        ? { before: "You marked ", title: bookTitle, after: ` as sold to ${name}` }
        : { before: `${name} marked `, title: bookTitle, after: " as sold to you" };
    case "SOLD_ELSEWHERE":
      return byMe
        ? { before: "You marked ", title: bookTitle, after: " as sold" }
        : { before: "", title: bookTitle, after: " has been sold to someone else" };
    case "BOOK_UNAVAILABLE":
      return { before: "", title: bookTitle, after: " is no longer available" };
    case "BOOK_AVAILABLE":
      return { before: "", title: bookTitle, after: " is back on the shelf" };
    default:
      return { before: "", title: "", after: message.body ?? "" };
  }
};

/** The note under every composer (mockup 4b). */
export const MONEY_NOTE = "Rebooked never handles the money. Meet somewhere public and check the book before you pay.";

export const MESSAGE_MAX = 2000;
