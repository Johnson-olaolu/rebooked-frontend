import { Search } from "lucide-react";
import { useEffect, useState } from "react";
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
  ALL: "No conversations match that search.",
  UNREAD: "You're all caught up.",
  SELLING: "Nobody's asked about your books yet.",
  BUYING: "You haven't messaged a seller yet.",
};

export const ConversationRow = ({ conversation, compact }: { conversation: IConversation; compact?: boolean }) => {
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
          "grid grid-cols-[44px_1fr_auto] items-start gap-3 border-l-3 px-4 py-3.5 transition-colors",
          isActive ? "border-primary bg-secondary/70" : "border-transparent hover:bg-secondary/40",
          unread && !isActive && "bg-primary/[0.04]",
        )
      }
    >
      <UserAvatar name={name} photoUrl={conversation.other?.profilePictureUrl} className="size-11 text-base" />
      <div className="min-w-0">
        <p className="truncate">
          <span className={cn("text-[15px]", unread ? "font-bold" : "font-semibold")}>{name}</span>
          {!compact && <span className="text-sm text-foreground/55"> · {roleLine(conversation)}</span>}
        </p>
        {books.length > 0 && (
          <p className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="truncate rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/80">
              {books[0].title}
            </span>
            {books.length > 1 && <span className="shrink-0 text-xs text-foreground/55">+{books.length - 1} more</span>}
          </p>
        )}
        <p className={cn("mt-1 truncate text-sm", unread ? "text-foreground/85" : "text-foreground/55")}>{preview}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-xs whitespace-nowrap text-foreground/50">
          {relativeTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}
        </span>
        {unread && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9c3a2c] px-1.5 text-[11px] font-bold text-white">
            {conversation.unread > 99 ? "99+" : conversation.unread}
          </span>
        )}
      </div>
    </NavLink>
  );
};

interface ConversationListProps {
  /** Two-pane layout: narrower rows. */
  compact?: boolean;
  /** Called once the first page has loaded, so the page can show the full-page empty state. */
  onCounts?: (counts: IConversationPage["counts"] | undefined) => void;
  className?: string;
}

/** Inbox (mockups 4a, 4e): filter pills, search, one row per person. */
const ConversationList = ({ compact, onCounts, className }: ConversationListProps) => {
  const [filter, setFilter] = useState<ConversationFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useConversations(filter, search);
  const counts = query.data?.pages[0]?.counts;
  const rows = query.data?.pages.flatMap((page) => page.content) ?? [];

  useEffect(() => {
    if (!query.isLoading) onCounts?.(counts);
  }, [counts, query.isLoading, onCounts]);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="space-y-3 border-b border-foreground/10 p-4">
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
        <div role="tablist" aria-label="Show" className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
                filter === item.value
                  ? "border-foreground bg-foreground font-semibold text-background"
                  : "border-foreground/15 text-foreground/70 hover:border-foreground/40",
              )}
            >
              {item.label}
              {counts && ` · ${counts[item.value] ?? 0}`}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isError ? (
          <div className="p-6 text-center text-sm text-foreground/60">
            We couldn't load your conversations.{" "}
            <button type="button" onClick={() => query.refetch()} className="font-semibold text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : query.isLoading ? (
          <ul aria-busy className="divide-y divide-foreground/10">
            {[0, 1, 2, 3].map((index) => (
              <li key={index} className="flex gap-3 px-4 py-4">
                <div className="size-11 animate-pulse rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
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
          <ul className={cn("divide-y divide-foreground/10", query.isPlaceholderData && "opacity-60")}>
            {rows.map((conversation) => (
              <li key={conversation.id}>
                <ConversationRow conversation={conversation} compact={compact} />
              </li>
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <div className="p-4 text-center">
            <button
              type="button"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {query.isFetchingNextPage ? "Loading…" : "Show older conversations"}
            </button>
          </div>
        )}
      </div>
      <p className="border-t border-foreground/10 px-4 py-3 text-xs leading-relaxed text-foreground/50">
        Rebooked doesn't process payments. Arrange payment directly with the buyer or seller.
      </p>
    </div>
  );
};

export default ConversationList;
