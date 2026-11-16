import { CheckCheck, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import NotificationItem from "~/components/notifications/NotificationItem";
import { Button } from "~/components/ui/button";
import { isRead, useMarkNotificationsRead, useNotificationUnread, useNotifications } from "~/hooks/useNotifications";
import { cn } from "~/lib/utils";
import type { INotification, NotificationFilter } from "~/types/notification";
import { notificationGroup } from "~/utils/notification";
import EmptyState from "../components/EmptyState";

const FILTERS: { value: NotificationFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "UNREAD", label: "Unread" },
];

/** /dashboard/notifications: everything that happened around your books, newest first, grouped by day. */
const NotificationsPage = () => {
    const [filter, setFilter] = useState<NotificationFilter>("ALL");
    const unread = useNotificationUnread();
    const query = useNotifications(filter);
    const markRead = useMarkNotificationsRead();
    const sentinel = useRef<HTMLDivElement>(null);
    const items = query.data?.pages.flatMap((page) => page.content) ?? [];
    const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;

    useEffect(() => {
        document.title = `${unread ? `(${unread}) ` : ""}Notifications · Rebooked`;
    }, [unread]);

    // Load the next page as the end of the list comes into view.
    useEffect(() => {
        const target = sentinel.current;
        if (!target || !hasNextPage || isError) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
            },
            { rootMargin: "600px 0px" },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError, items.length]);

    const open = useCallback(
        (notification: INotification) => {
            if (!isRead(notification)) markRead([notification.id]);
        },
        [markRead],
    );

    // Today / Yesterday / This week / Earlier, keeping server order inside each group.
    const groups: { label: string; items: INotification[] }[] = [];
    for (const item of items) {
        const label = notificationGroup(item.updatedAt ?? item.createdAt);
        const last = groups.at(-1);
        if (last?.label === label) last.items.push(item);
        else groups.push({ label, items: [item] });
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl">Notifications</h1>
                    <p className="mt-1.5 text-foreground/60">
                        {unread ? `${unread} unread` : "Enquiries, sales and reminders about your books"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="ghost" className="h-10 rounded-md px-3 font-semibold">
                        <Link to="/dashboard/settings/notifications" aria-label="Notification settings">
                            <Settings className="size-4" aria-hidden /> <span className="hidden sm:inline">Settings</span>
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => markRead("all")}
                        disabled={unread === 0}
                        className="h-10 rounded-md px-4 font-semibold"
                    >
                        <CheckCheck className="size-4" aria-hidden /> Mark all as read
                    </Button>
                </div>
            </div>

            <div role="tablist" aria-label="Show" className="mb-4 inline-grid grid-cols-2 gap-1 rounded-lg bg-secondary/70 p-1">
                {FILTERS.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        role="tab"
                        aria-selected={filter === item.value}
                        onClick={() => setFilter(item.value)}
                        className={cn(
                            "rounded-md px-4 py-1.5 text-sm transition-colors",
                            filter === item.value ? "bg-card font-semibold text-foreground shadow-sm" : "text-foreground/65 hover:text-foreground",
                        )}
                    >
                        {item.label}
                        {item.value === "UNREAD" && unread > 0 && <span className="ml-1 text-foreground/50">{unread}</span>}
                    </button>
                ))}
            </div>

            {query.isError && items.length === 0 ? (
                <EmptyState
                    title="We couldn't load your notifications"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => query.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : query.isLoading ? (
                <ul aria-busy className="overflow-hidden rounded-xl border border-foreground/10 bg-card">
                    {Array.from({ length: 6 }, (_, index) => (
                        <li key={index} className="flex gap-3 border-b border-foreground/8 px-5 py-4 last:border-0">
                            <div className="size-10 animate-pulse rounded-full bg-secondary" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                                <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : items.length === 0 ? (
                filter === "UNREAD" ? (
                    <EmptyState title="You're all caught up" description="New enquiries, sales and reminders will show up here." />
                ) : (
                    <EmptyState
                        title="No notifications yet"
                        description="We'll let you know here when someone asks about one of your books, a book you're after is sold, or something on your shelf needs a look."
                    />
                )
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <section key={group.label} aria-label={group.label}>
                            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-foreground/50 uppercase">{group.label}</h2>
                            <ul className="divide-y divide-foreground/8 overflow-hidden rounded-xl border border-foreground/10 bg-card">
                                {group.items.map((notification) => (
                                    <li key={notification.id}>
                                        <NotificationItem notification={notification} onOpen={open} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}

            {hasNextPage && (
                <div ref={sentinel} className="py-6 text-center">
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
        </div>
    );
};

export default NotificationsPage;
