import { Bell } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import UnreadBadge from "~/components/chat/UnreadBadge";
import { isRead, useMarkNotificationsRead, useNotificationUnread, useNotifications } from "~/hooks/useNotifications";
import type { INotification } from "~/types/notification";
import NotificationItem from "./NotificationItem";

const PREVIEW_COUNT = 8;
const PAGE = "/dashboard/notifications";

const bellButton =
    "relative flex size-10 items-center justify-center rounded-full text-foreground/75 transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-secondary";

/**
 * The bell in the site header (logged in only). Desktop: a dropdown with the latest few. Phones go
 * straight to the notifications page.
 */
const NotificationBell = () => {
    const unread = useNotificationUnread();
    const [open, setOpen] = useState(false);
    // Only fetch the preview once the dropdown has been opened.
    const query = useNotifications("ALL", PREVIEW_COUNT, open);
    const markRead = useMarkNotificationsRead();
    const items = query.data?.pages[0]?.content.slice(0, PREVIEW_COUNT) ?? [];
    const label = unread ? `Notifications, ${unread} unread` : "Notifications";

    const openItem = useCallback(
        (notification: INotification) => {
            if (!isRead(notification)) markRead([notification.id]);
            setOpen(false);
        },
        [markRead],
    );

    const badge = <UnreadBadge count={unread} className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 px-1 text-[10px] ring-2 ring-card" />;

    return (
        <>
            <Link to={PAGE} aria-label={label} className={`${bellButton} md:hidden`}>
                <Bell className="size-5" aria-hidden />
                {badge}
            </Link>

            <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
                <PopoverPrimitive.Trigger aria-label={label} className={`${bellButton} hidden md:flex`}>
                    <Bell className="size-5" aria-hidden />
                    {badge}
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        align="end"
                        sideOffset={8}
                        className="z-50 flex max-h-[min(36rem,calc(100dvh-6rem))] w-[26rem] flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card shadow-[0_16px_48px_rgba(36,27,18,0.18)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    >
                        <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
                            <p className="font-serif text-xl">Notifications</p>
                            <button
                                type="button"
                                onClick={() => markRead("all")}
                                disabled={unread === 0}
                                className="text-sm font-semibold text-primary hover:underline disabled:text-foreground/35 disabled:no-underline"
                            >
                                Mark all as read
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {query.isLoading ? (
                                <ul aria-busy>
                                    {[0, 1, 2].map((index) => (
                                        <li key={index} className="flex gap-3 px-4 py-3">
                                            <div className="size-10 animate-pulse rounded-full bg-secondary" />
                                            <div className="flex-1 space-y-2 pt-1">
                                                <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                                                <div className="h-3 w-12 animate-pulse rounded bg-secondary" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : query.isError ? (
                                <p className="px-4 py-8 text-center text-sm text-foreground/60">
                                    We couldn't load your notifications.{" "}
                                    <button type="button" onClick={() => query.refetch()} className="font-semibold text-primary hover:underline">
                                        Try again
                                    </button>
                                </p>
                            ) : items.length === 0 ? (
                                <p className="px-6 py-10 text-center text-sm text-foreground/60">
                                    Nothing yet. Enquiries, sales and reminders about your books will show up here.
                                </p>
                            ) : (
                                <ul className="divide-y divide-foreground/8">
                                    {items.map((notification) => (
                                        <li key={notification.id}>
                                            <NotificationItem notification={notification} onOpen={openItem} compact />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <Link
                            to={PAGE}
                            onClick={() => setOpen(false)}
                            className="border-t border-foreground/10 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-secondary/50"
                        >
                            See all notifications
                        </Link>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
        </>
    );
};

export default NotificationBell;
