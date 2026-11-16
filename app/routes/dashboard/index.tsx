import { Button } from "~/components/ui/button";
import { getDisplayName } from "~/components/UserAvatar";
import { useBaseStore } from "~/hooks/store";
import { useConversations, useUnreadCount } from "~/hooks/useChat";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import bookService from "~/services/book.service";
import type { BookStatus } from "~/types/book";

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

/** Counts default to 0 until the shelf loads (or if it can't), so tiles never show a placeholder. */
const STATS = (counts: Partial<Record<BookStatus, number>> | undefined, conversations: number, unread: number) => {
    const onShelf = counts?.ACTIVE ?? 0;
    const sold = counts?.SOLD ?? 0;
    return [
        { label: "Books on shelf", value: onShelf, hint: onShelf ? "Available in the shop" : "Add your first book" },
        {
            label: "In conversation",
            value: conversations,
            hint: conversations ? `${conversations === 1 ? "Person" : "People"} you're chatting with` : "No open chats",
            to: "/dashboard/messages",
        },
        {
            label: "Unread messages",
            value: unread,
            hint: unread ? "Waiting for a reply" : "You're all caught up",
            to: "/dashboard/messages",
        },
        { label: "Sold all time", value: sold, hint: sold ? "Books sold so far" : "No sales yet" },
    ];
};

const DashboardOverview = () => {
    const user = useBaseStore((state) => state.user);
    const firstName = getDisplayName(user).split(" ")[0];
    // Only the counts are needed here; shares the cache with My shelf's first tab.
    const shelfQuery = useQuery({
        queryKey: ["shelf", "ACTIVE"],
        queryFn: () => bookService.getMyShelf({ status: "ACTIVE" }),
        select: (response) => response.data,
        retry: 1,
    });
    const unread = useUnreadCount();
    const conversations = useConversations("ALL", "").data?.pages[0]?.counts.ALL ?? 0;

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl">
                        {greeting()}
                        {firstName ? `, ${firstName}` : ""}
                    </h1>
                    <p className="mt-1.5 text-foreground/60">
                        {unread ? (
                            <Link to="/dashboard/messages" className="font-semibold text-primary hover:underline">
                                {unread} unread {unread === 1 ? "message" : "messages"} →
                            </Link>
                        ) : (
                            "Nothing needs your attention right now."
                        )}
                    </p>
                </div>
                {/* Full-width on mobile (mockup 3f), top-right on desktop (mockup 3a). */}
                <Button
                    asChild
                    className="h-11 w-full rounded-md bg-primary md:w-auto px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    <Link to="/dashboard/shelf/new">+ Add to shelf</Link>
                </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {STATS(shelfQuery.data?.counts, conversations, unread).map((stat) => {
                    const content = (
                        <>
                            <div className="text-sm text-foreground/60">{stat.label}</div>
                            <div className="mt-1 font-serif text-4xl text-primary">{stat.value}</div>
                            <div className="mt-1 text-xs text-foreground/50">{stat.hint}</div>
                        </>
                    );
                    return "to" in stat && stat.to ? (
                        <Link
                            key={stat.label}
                            to={stat.to}
                            className="rounded-lg border border-foreground/10 bg-card p-5 transition-colors hover:border-primary/40"
                        >
                            {content}
                        </Link>
                    ) : (
                        <div key={stat.label} className="rounded-lg border border-foreground/10 bg-card p-5">
                            {content}
                        </div>
                    );
                })}
            </div>

            <section className="mt-8 rounded-lg border border-foreground/10 bg-card p-6">
                <h2 className="font-serif text-xl">Needs your attention</h2>
                <p className="mt-2 text-sm text-foreground/55">
                    Replies and books waiting to be marked as sold will show up here.
                </p>
            </section>
        </>
    );
};

export default DashboardOverview;
