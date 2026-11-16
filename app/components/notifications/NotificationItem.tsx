import { memo } from "react";
import { Link } from "react-router";
import UserAvatar from "~/components/UserAvatar";
import { isRead } from "~/hooks/useNotifications";
import { cn } from "~/lib/utils";
import type { INotification } from "~/types/notification";
import { relativeTime } from "~/utils/chat";
import { notificationText, presentNotification } from "~/utils/notification";

interface NotificationItemProps {
  notification: INotification;
  /** Called before navigating (marks it read). */
  onOpen: (notification: INotification) => void;
  compact?: boolean;
}

/** One notification: who/what, the text, when, and an unread dot. Used by the page and the bell. */
const NotificationItem = ({ notification, onOpen, compact }: NotificationItemProps) => {
  const { icon: Icon, segments, detail, to } = presentNotification(notification);
  const unread = !isRead(notification);

  return (
    <Link
      to={to}
      onClick={() => onOpen(notification)}
      aria-label={`${notificationText(notification)}${unread ? " (unread)" : ""}`}
      className={cn(
        "flex items-start gap-3 transition-colors hover:bg-secondary/50",
        compact ? "px-4 py-3" : "px-4 py-3.5 md:px-5",
        unread && "bg-primary/[0.045]",
      )}
    >
      <span className="relative mt-0.5 shrink-0">
        {notification.actor ? (
          <UserAvatar name={notification.actor.userName} photoUrl={notification.actor.profilePictureUrl} className="size-10 text-sm" />
        ) : notification.book?.coverUrl ? (
          <img src={notification.book.coverUrl} alt="" className="h-12 w-9 rounded-sm object-cover" />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
            <Icon className="size-4.5" aria-hidden />
          </span>
        )}
        {notification.actor && (
          <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-secondary text-primary">
            <Icon className="size-3" aria-hidden />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[15px] leading-snug", unread ? "text-foreground" : "text-foreground/75")}>
          {segments.map((segment, index) =>
            typeof segment === "string" ? (
              segment
            ) : "person" in segment ? (
              <strong key={index} className="font-semibold">
                {segment.person}
              </strong>
            ) : (
              <em key={index} className="font-serif text-[16px]">
                {segment.book}
              </em>
            ),
          )}
        </span>
        {detail && <span className="mt-0.5 block truncate text-sm text-foreground/55">“{detail}”</span>}
        <span className={cn("mt-1 block text-xs", unread ? "font-semibold text-[#9c3a2c]" : "text-foreground/45")}>
          {relativeTime(notification.updatedAt ?? notification.createdAt)}
        </span>
      </span>
      {unread && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[#9c3a2c]" aria-hidden />}
    </Link>
  );
};

export default memo(NotificationItem);
