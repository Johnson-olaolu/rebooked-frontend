import { Search } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import UserAvatar from "~/components/UserAvatar";
import { Input } from "~/components/ui/input";
import { useConversations } from "~/hooks/useChat";
import { cn } from "~/lib/utils";
import type { ConversationFilter, IConversation, IConversationPage } from "~/types/chat";
import { relativeTime, roleLine, sortedBooks, threadPath } from "~/utils/chat";

const FILTERS: { value: ConversationFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: "SELLING", label: "Selling" },
  { value: "BUYING", label: "Buying" },
];

const EMPTY_FILTER: Record<ConversationFilter, string> = {
  ALL: "No conversations yet.",
  UNREAD: "You're all caught up.",
  SELLING: "Nobody's asked about your books yet.",
  BUYING: "You haven't messaged a seller yet.",
};

/** One person (mockup 4a, made denser so long lists scan quickly). Re-renders only when it changes. */
export const ConversationRow = memo(
  ({ conversation }: { conversation: IConversation }) => {
    const books = sortedBooks(conversation.books);
    const unread = conversation.unread > 0;
    const name = conversation.other?.userName?.trim() || "Rebooked user";
    const preview = conversation.lastMessage?.preview ?? "";

    return (
      <NavLink
        to={threadPath(conversation.id)}
        aria-label={`${name}${unread ? `, ${conversation.unread} unread` : ""}`}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 border-l-3 py-2.5 pr-4 pl-3 transition-colors",
            isActive ? "border-primary bg-secondary/80" : "border-transparent hover:bg-secondary/40",
          )
        }
      >
        <UserAvatar name={name} photoUrl={conversation.other?.profilePictureUrl} className="size-11 text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-[15px]", unread ? "font-bold" : "font-semibold")}>{name}</span>
            <span className={cn("shrink-0 text-xs", unread ? "font-semibold text-[#9c3a2c]" : "text-foreground/50")}>
              {relativeTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}
            </span>
          </div>
          {books.length > 0 && (
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs">
              <span className="truncate font-serif text-[13px] text-foreground/75 italic">{books[0].title}</span>
              {books.length > 1 && <span className="shrink-0 text-foreground/50">+{books.length - 1}</span>}
              <span className="shrink-0 text-foreground/40">· {roleLine(conversation)}</span>
            </p>
          )}
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className={cn("truncate text-sm", unread ? "text-foreground/85" : "text-foreground/55")}>{preview}</p>
            {unread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#9c3a2c] px-1.5 text-[11px] font-bold text-white">
                {conversation.unread > 99 ? "99+" : conversation.unread}
              </span>
            )}
          </div>
        </div>
      </NavLink>
    );
  },
  (a, b) =>
    a.conversation.id === b.conversation.id &&
    a.conversation.unread === b.conversation.unread &&
    a.conversation.lastMessage?.id === b.conversation.lastMessage?.id &&
    a.conversation.books.length === b.conversation.books.length &&
    a.conversation.books.every((book, index) => book.state === b.conversation.books[index]?.state),
);
ConversationRow.displayName = "ConversationRow";

interface ConversationListProps {
  /** Total unread, shown in the pane header. */
  unread?: number;
  /** Called once the first page has loaded, so the page can show the full-page empty state. */
  onCounts?: (counts: IConversationPage["counts"] | undefined) => void;
  className?: string;
}

/** The inbox pane (mockups 4a, 4e): header, search, filters, then every conversation, loading more as you scroll. */
const ConversationList = ({ unread = 0, onCounts, className }: ConversationListProps) => {
  const [filter, setFilter] = useState<ConversationFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useConversations(filter, search);
  const counts = query.data?.pages[0]?.counts;
  const rows = query.data?.pages.flatMap((page) => page.content) ?? [];
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;

  useEffect(() => {
    if (!query.isLoading) onCounts?.(counts);
  }, [counts, query.isLoading, onCounts]);

  // Back to the top when the filter or search changes.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [filter, search]);

  // Load the next page as the end of the list comes into view.
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { root: scroller.current, rootMargin: "400px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError, rows.length]);

  return (
    <div className={cn("flex min-h-0 flex-col bg-card", className)}>
      <div className="shrink-0 space-y-3 border-b border-foreground/10 px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-serif text-2xl md:text-[1.7rem]">Messages</h1>
          {unread > 0 && <span className="text-sm font-semibold text-[#9c3a2c]">{unread} unread</span>}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" aria-hidden />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by book or name"
            aria-label="Search by book or name"
            className="h-10 bg-background pl-9"
          />
        </div>
        <div role="tablist" aria-label="Show" className="grid grid-cols-4 gap-1 rounded-lg bg-secondary/70 p-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "truncate rounded-md px-1.5 py-1.5 text-[13px] transition-colors",
                filter === item.value ? "bg-card font-semibold text-foreground shadow-sm" : "text-foreground/65 hover:text-foreground",
              )}
            >
              {item.label}
              {counts && counts[item.value] > 0 && <span className="ml-1 text-foreground/50">{counts[item.value]}</span>}
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {query.isError && rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-foreground/60">
            We couldn't load your conversations.{" "}
            <button type="button" onClick={() => query.refetch()} className="font-semibold text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : query.isLoading ? (
          <ul aria-busy>
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index} className="flex gap-3 px-4 py-3">
                <div className="size-11 animate-pulse rounded-full bg-secondary" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                </div>
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-foreground/60">
            {search ? `Nothing matches “${search}”.` : EMPTY_FILTER[filter]}
          </p>
        ) : (
          <ul className={cn("divide-y divide-foreground/8", query.isPlaceholderData && "opacity-60")}>
            {rows.map((conversation) => (
              <li key={conversation.id}>
                <ConversationRow conversation={conversation} />
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div ref={sentinel} className="p-4 text-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm font-semibold text-primary hover:underline disabled:text-foreground/50 disabled:no-underline"
            >
              {isFetchingNextPage ? "Loading more…" : isError ? "Couldn't load more. Try again" : "Load more"}
            </button>
          </div>
        )}
        {!hasNextPage && rows.length > 20 && (
          <p className="py-4 text-center text-xs text-foreground/40">That's everyone.</p>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
