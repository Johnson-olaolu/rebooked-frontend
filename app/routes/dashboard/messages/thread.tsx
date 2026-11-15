import { ArrowLeft, ChevronDown, SendHorizontal } from "lucide-react";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import UserAvatar from "~/components/UserAvatar";
import { Button } from "~/components/ui/button";
import ConfirmDialog from "~/components/ui/confirm-dialog";
import { useBaseStore } from "~/hooks/store";
import { useChatActions, useConversation, useMessages, usePendingMessages } from "~/hooks/useChat";
import { ChatError } from "~/lib/chatSocket";
import { cn } from "~/lib/utils";
import type { IConversation, IConversationBook, IMessage, IPendingMessage } from "~/types/chat";
import { conditionLabel } from "~/utils/book";
import {
    BOOK_STATE_PILL,
    MESSAGE_MAX,
    MONEY_NOTE,
    bookStateLabel,
    dayLabel,
    firstName,
    isOpen,
    roleLine,
    sameDay,
    sortedBooks,
    systemLine,
    timeLabel,
} from "~/utils/chat";
import { getErrorStatus } from "~/utils/https";
import { formatNaira } from "~/utils/money";
import { formatNgState } from "~/utils/nigeria";
import { displayName, displayPlace } from "~/utils/text";

type Item =
    | { kind: "message"; message: IMessage }
    | { kind: "pending"; pending: IPendingMessage };

const itemTime = (item: Item) => (item.kind === "message" ? item.message.createdAt : item.pending.createdAt);
const itemBook = (item: Item) => (item.kind === "message" ? item.message.bookId : item.pending.bookId);

/* ------------------------------------------------------------------------------------------------ */

const BookCover = ({ book, className }: { book: IConversationBook; className?: string }) =>
    book.coverUrl ? (
        <img src={book.coverUrl} alt="" className={cn("shrink-0 rounded-sm object-cover", className)} />
    ) : (
        <div className={cn("shrink-0 rounded-sm bg-[#8a5a36]", className)} aria-hidden />
    );

interface BooksStripProps {
    conversation: IConversation;
    onMarkSold: (book: IConversationBook) => void;
}

/** "Books in this chat": what's being discussed, its state, and the seller's Mark as sold. */
const BooksStrip = ({ conversation, onMarkSold }: BooksStripProps) => {
    const [expanded, setExpanded] = useState(false);
    const books = sortedBooks(conversation.books);
    const otherName = displayName(conversation.other?.userName);

    return (
        <div className="shrink-0 border-b border-foreground/10 bg-card/70">
            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold tracking-wide text-foreground/55 uppercase md:pointer-events-none"
            >
                {books.length === 1 ? "Book in this chat" : `${books.length} books in this chat`}
                <ChevronDown className={cn("size-4 transition-transform md:hidden", expanded && "rotate-180")} aria-hidden />
            </button>
            <ul className={cn("max-h-56 overflow-y-auto px-4 pb-2 md:max-h-36", !expanded && "hidden md:block")}>
                {books.map((book) => {
                    const open = isOpen(book);
                    const canSell = book.role === "SELLER" && open;
                    const meta = [formatNaira(book.price, book.isFree), conditionLabel(book.condition)].filter(Boolean).join(" · ");
                    return (
                        <li key={book.bookId} className={cn("flex items-center gap-3 py-1.5", !open && "opacity-70")}>
                            <BookCover book={book} className="h-12 w-9" />
                            <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    {book.status ? (
                                        <Link to={`/book/${book.bookId}`} className="truncate font-serif text-[17px] leading-tight hover:underline">
                                            {book.title}
                                        </Link>
                                    ) : (
                                        <span className="truncate font-serif text-[17px] leading-tight">{book.title}</span>
                                    )}
                                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BOOK_STATE_PILL[book.state])}>
                                        {bookStateLabel(book, otherName)}
                                    </span>
                                </p>
                                <p className="truncate text-xs text-foreground/55">
                                    {meta}
                                    {meta && " · "}
                                    {book.role === "SELLER" ? "You're the seller" : "You're buying"}
                                </p>
                            </div>
                            {canSell && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => onMarkSold(book)}
                                    className="h-8 shrink-0 rounded-md bg-olive px-3 text-xs font-semibold text-white hover:bg-olive/90"
                                >
                                    <span>
                                        Mark as sold<span className="hidden sm:inline"> to {firstName(otherName)}</span>
                                    </span>
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

/* ------------------------------------------------------------------------------------------------ */

const ThreadPage = () => {
    const { id = "" } = useParams();
    const [params] = useSearchParams();
    const meId = useBaseStore((state) => state.user?.id) ?? "";
    const conversationQuery = useConversation(id);
    const conversation = conversationQuery.data;
    const messagesQuery = useMessages(id);
    const pending = usePendingMessages(id);
    const { sendMessage, retry, discard, markRead, markSoldToBuyer } = useChatActions();

    const [draft, setDraft] = useState("");
    const [aboutBookId, setAboutBookId] = useState<string | undefined>(params.get("book") ?? undefined);
    const [selling, setSelling] = useState<IConversationBook | null>(null);
    const [sellPending, setSellPending] = useState(false);

    const scroller = useRef<HTMLDivElement>(null);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const nearBottom = useRef(true);
    const prependAnchor = useRef<number | null>(null);

    const books = useMemo(() => (conversation ? sortedBooks(conversation.books) : []), [conversation]);
    const bookById = useMemo(() => new Map(books.map((book) => [book.bookId, book])), [books]);
    const otherName = displayName(conversation?.other?.userName) || "Rebooked user";

    // Default "about" book: the link's ?book=, else the most recently discussed one that's still
    // available. Once the chosen book is sold, move on to one that isn't.
    useEffect(() => {
        if (!books.length) return;
        const fallback = (books.find(isOpen) ?? books[0]).bookId;
        setAboutBookId((current) => {
            const chosen = current ? bookById.get(current) : undefined;
            if (!chosen) return fallback;
            return isOpen(chosen) || !books.some(isOpen) || current === params.get("book") ? current : fallback;
        });
    }, [books, bookById, params]);
    useEffect(() => {
        const fromLink = params.get("book");
        if (fromLink) setAboutBookId(fromLink);
        setDraft("");
    }, [id, params]);

    // Oldest → newest, then anything not yet acknowledged.
    const items: Item[] = useMemo(() => {
        const confirmed = (messagesQuery.data?.pages ?? []).flatMap((page) => page.content).reverse();
        const seen = new Set(confirmed.map((message) => message.clientId).filter(Boolean));
        return [
            ...confirmed.map((message) => ({ kind: "message", message }) as Item),
            ...pending.filter((item) => !seen.has(item.clientId)).map((item) => ({ kind: "pending", pending: item }) as Item),
        ];
    }, [messagesQuery.data, pending]);

    const lastConfirmed = [...items].reverse().find((item): item is Extract<Item, { kind: "message" }> => item.kind === "message");
    const newestId = lastConfirmed?.message.id;
    const newestFromOther = lastConfirmed && lastConfirmed.message.senderId !== meId;

    // Read receipts: when the thread is on screen and there's something new from them.
    useEffect(() => {
        if (!conversation || !newestId) return;
        const send = () => {
            if (document.visibilityState === "visible" && (conversation.unread > 0 || newestFromOther)) markRead(id, newestId);
        };
        send();
        document.addEventListener("visibilitychange", send);
        return () => document.removeEventListener("visibilitychange", send);
        // Re-run per new message, not on every conversation update (markRead is stable).
    }, [id, newestId, !!conversation]);

    // "Seen" sits under my latest message the other person has read.
    const seenUpTo = useMemo(() => {
        const readId = conversation?.otherLastReadMessageId;
        if (!readId) return -1;
        return items.findIndex((item) => item.kind === "message" && item.message.id === readId);
    }, [items, conversation?.otherLastReadMessageId]);
    const myLastIndex = useMemo(() => {
        for (let index = items.length - 1; index >= 0; index -= 1) {
            const item = items[index];
            if (item.kind === "pending" || (item.message.senderId === meId && item.message.type === "TEXT")) return index;
        }
        return -1;
    }, [items, meId]);

    // Scrolling: stick to the bottom for new messages, keep position when older ones load above.
    useLayoutEffect(() => {
        const element = scroller.current;
        if (!element) return;
        if (prependAnchor.current !== null) {
            element.scrollTop = element.scrollHeight - prependAnchor.current;
            prependAnchor.current = null;
        } else if (nearBottom.current) {
            element.scrollTop = element.scrollHeight;
        }
    }, [items.length]);
    useEffect(() => {
        nearBottom.current = true;
    }, [id]);

    const loadOlder = () => {
        const element = scroller.current;
        if (!element || !messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) return;
        prependAnchor.current = element.scrollHeight - element.scrollTop;
        void messagesQuery.fetchNextPage();
    };

    const onScroll = () => {
        const element = scroller.current;
        if (!element) return;
        nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        if (element.scrollTop < 120) loadOlder();
    };

    const body = draft.trim();
    const tooLong = draft.length > MESSAGE_MAX;
    const canSend = !!conversation && body.length > 0 && !tooLong;

    const send = () => {
        if (!canSend) return;
        nearBottom.current = true;
        sendMessage(id, body, books.length > 1 ? aboutBookId : (books[0]?.bookId ?? aboutBookId));
        setDraft("");
        textarea.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send();
        }
    };

    // Grow the composer with its content, up to ~6 lines.
    useLayoutEffect(() => {
        const element = textarea.current;
        if (!element) return;
        element.style.height = "auto";
        element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
    }, [draft]);

    const confirmSold = async () => {
        if (!selling) return;
        setSellPending(true);
        try {
            await markSoldToBuyer(id, selling.bookId);
            toast.success(`Marked as sold to ${firstName(otherName)}`);
            setSelling(null);
        } catch (error) {
            toast.error(error instanceof ChatError ? error.message : "Couldn't mark it as sold. Try again.");
        } finally {
            setSellPending(false);
        }
    };

    if (conversationQuery.isError && [400, 403, 404].includes(getErrorStatus(conversationQuery.error) ?? 0)) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <p className="font-serif text-2xl">We couldn't find that conversation</p>
                <Link to="/dashboard/messages" className="mt-3 text-sm font-semibold text-primary hover:underline">
                    Back to conversations
                </Link>
            </div>
        );
    }

    let previousBook: string | null | undefined;

    return (
        <>
            {/* Header */}
            <header className="flex shrink-0 items-center gap-3 border-b border-foreground/10 bg-card px-3 py-3 md:px-5">
                <Link
                    to="/dashboard/messages"
                    aria-label="Back to conversations"
                    className="flex size-9 items-center justify-center rounded-md text-foreground/70 hover:bg-secondary md:hidden"
                >
                    <ArrowLeft className="size-5" />
                </Link>
                {conversation ? (
                    <Link to={`/seller/${conversation.other.id}`} className="flex min-w-0 items-center gap-3 rounded-md hover:opacity-85">
                        <UserAvatar name={otherName} photoUrl={conversation.other.profilePictureUrl} className="size-10 text-sm" />
                        <span className="min-w-0">
                            <span className="block truncate font-semibold">{otherName}</span>
                            <span className="block truncate text-xs text-foreground/55">
                                {[
                                    roleLine(conversation),
                                    [displayPlace(conversation.other.city), formatNgState(conversation.other.state)].filter(Boolean).join(", "),
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        </span>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3" aria-busy>
                        <div className="size-10 animate-pulse rounded-full bg-secondary" />
                        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                    </div>
                )}
            </header>

            {conversation && conversation.books.length > 0 && <BooksStrip conversation={conversation} onMarkSold={setSelling} />}

            {/* Messages */}
            <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5" aria-live="polite">
                {messagesQuery.isFetchingNextPage && <p className="pb-3 text-center text-xs text-foreground/50">Loading earlier messages…</p>}
                {messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage && (
                    <div className="pb-3 text-center">
                        <button type="button" onClick={loadOlder} className="text-xs font-semibold text-primary hover:underline">
                            Load earlier messages
                        </button>
                    </div>
                )}
                {messagesQuery.isLoading ? (
                    <div aria-busy className="mx-auto max-w-4xl space-y-3">
                        <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-secondary" />
                        <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-secondary" />
                        <div className="h-14 w-3/5 animate-pulse rounded-2xl bg-secondary" />
                    </div>
                ) : messagesQuery.isError ? (
                    <p className="text-center text-sm text-foreground/60">
                        We couldn't load the messages.{" "}
                        <button type="button" onClick={() => messagesQuery.refetch()} className="font-semibold text-primary hover:underline">
                            Try again
                        </button>
                    </p>
                ) : items.length === 0 ? (
                    <p className="pt-10 text-center text-sm text-foreground/55">Say hello: ask if it's still available, or where to meet.</p>
                ) : (
                    <ol className="mx-auto flex w-full max-w-4xl flex-col gap-1.5">
                        {items.map((item, index) => {
                            const time = itemTime(item);
                            const previous = items[index - 1];
                            const newDay = !previous || !sameDay(itemTime(previous), time);
                            const bookId = itemBook(item);
                            const book = bookId ? bookById.get(bookId) : undefined;
                            const showBook = books.length > 1 && !!book && bookId !== previousBook && !(item.kind === "message" && item.message.type === "SYSTEM");
                            if (bookId) previousBook = bookId;
                            const key = item.kind === "message" ? item.message.id : item.pending.clientId;

                            const separator = newDay && (
                                <li className="my-3 flex justify-center">
                                    <span className="rounded-full bg-secondary px-3 py-0.5 text-xs text-foreground/60">{dayLabel(time)}</span>
                                </li>
                            );

                            if (item.kind === "message" && item.message.type === "SYSTEM") {
                                const line = systemLine(item.message, { meId, otherName, bookTitle: book?.title ?? "this book" });
                                return (
                                    <Fragment key={key}>
                                        {separator}
                                        <li className="my-2 text-center text-xs text-foreground/55">
                                            {line.before}
                                            {line.title && <em className="font-serif text-[13px] text-foreground/75 italic">{line.title}</em>}
                                            {line.after}
                                            <span className="text-foreground/40"> · {timeLabel(time)}</span>
                                        </li>
                                    </Fragment>
                                );
                            }

                            const mine = item.kind === "pending" || item.message.senderId === meId;
                            const text = item.kind === "message" ? (item.message.body ?? "") : item.pending.body;
                            const failed = item.kind === "pending" ? item.pending.failed : undefined;
                            const sending = item.kind === "pending" && !failed;
                            const status =
                                index === myLastIndex && mine && !failed
                                    ? sending
                                        ? "Sending…"
                                        : seenUpTo >= index
                                          ? "Seen"
                                          : "Sent"
                                    : undefined;

                            return (
                                <Fragment key={key}>
                                    {separator}
                                    <li className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                                        {showBook && (
                                            <span className="mt-2 mb-1 rounded-full border border-foreground/10 px-2 py-0.5 text-[11px] text-foreground/60">
                                                Re: <span className="font-serif italic">{book!.title}</span>
                                            </span>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap md:max-w-[66%]",
                                                mine ? "rounded-br-md bg-[#6a4326] text-[#f6efe1]" : "rounded-bl-md bg-[#ece0c9] text-foreground",
                                                sending && "opacity-70",
                                                failed && "border border-[#9c3a2c]/50",
                                            )}
                                        >
                                            {text}
                                        </div>
                                        <span className="mt-0.5 px-1 text-[11px] text-foreground/45">
                                            {timeLabel(time)}
                                            {status && ` · ${status}`}
                                        </span>
                                        {failed && item.kind === "pending" && (
                                            <span className="px-1 text-[12px] text-[#9c3a2c]">
                                                {failed}{" "}
                                                <button type="button" onClick={() => retry(item.pending)} className="font-semibold underline">
                                                    Retry
                                                </button>{" "}
                                                ·{" "}
                                                <button type="button" onClick={() => discard(item.pending)} className="underline">
                                                    Delete
                                                </button>
                                            </span>
                                        )}
                                    </li>
                                </Fragment>
                            );
                        })}
                    </ol>
                )}
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-foreground/10 bg-card px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-5">
                <p className="mb-2 rounded-md bg-secondary/70 px-3 py-1.5 text-[12px] leading-snug text-foreground/65">{MONEY_NOTE}</p>
                {books.length > 1 && (
                    <label className="mb-2 flex items-center gap-2 text-xs text-foreground/60">
                        About
                        <select
                            value={aboutBookId ?? ""}
                            onChange={(event) => setAboutBookId(event.target.value)}
                            aria-label="Which book is this about?"
                            className="h-8 max-w-[16rem] truncate rounded-md border border-foreground/15 bg-background px-2 text-xs text-foreground"
                        >
                            {books.map((book) => (
                                <option key={book.bookId} value={book.bookId}>
                                    {book.title}
                                    {isOpen(book) ? "" : ` · ${bookStateLabel(book, otherName)}`}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <div className="flex items-end gap-2">
                    <textarea
                        ref={textarea}
                        rows={1}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={conversation ? `Message ${firstName(otherName)}…` : "Message…"}
                        aria-label="Message"
                        disabled={!conversation}
                        className="min-h-11 flex-1 resize-none rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-[15px] leading-snug outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-60"
                    />
                    <Button
                        type="button"
                        onClick={send}
                        disabled={!canSend}
                        aria-label="Send"
                        className="h-11 shrink-0 rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        <SendHorizontal className="size-4.5" aria-hidden />
                        <span className="hidden sm:inline">Send</span>
                    </Button>
                </div>
                {tooLong && (
                    <p className="mt-1 text-xs text-[#9c3a2c]">
                        That's {draft.length.toLocaleString()} characters; keep it under {MESSAGE_MAX.toLocaleString()}.
                    </p>
                )}
            </div>

            <ConfirmDialog
                open={!!selling}
                onOpenChange={(open) => !open && !sellPending && setSelling(null)}
                title={`Mark as sold to ${firstName(otherName)}?`}
                description={
                    <>
                        <em className="font-serif">{selling?.title}</em> leaves the shop and shows as sold to {otherName} in this chat. Anyone
                        else you're chatting with about it will see it's gone. You can put it back on your shelf later.
                    </>
                }
                confirmLabel="Yes, it's sold"
                pendingLabel="Marking…"
                tone="olive"
                pending={sellPending}
                onConfirm={confirmSold}
            />
        </>
    );
};

export default ThreadPage;
