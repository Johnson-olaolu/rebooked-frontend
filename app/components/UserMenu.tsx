import { Bell, ChevronDown, ChevronsUpDown, LayoutDashboard, Library, LogOut, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useUnreadCount } from "~/hooks/useChat";
import { useNotificationUnread } from "~/hooks/useNotifications";
import { useLogout } from "~/hooks/useLogout";
import { cn } from "~/lib/utils";
import type { IUser } from "~/types/user";
import { formatNgState } from "~/utils/nigeria";
import UnreadBadge from "./chat/UnreadBadge";
import UserAvatar, { getDisplayName } from "./UserAvatar";
import { displayPlace } from "~/utils/text";

export const USER_MENU_LINKS = [
  { label: "My dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My shelf", to: "/dashboard/shelf", icon: Library },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
  { label: "Profile settings", to: "/dashboard/settings", icon: Settings },
];

interface UserMenuProps {
  user: IUser;
  /** "header": avatar + name pill on light backgrounds. "sidebar": the dashboard sidebar's user block. */
  variant?: "header" | "sidebar";
  /** Header: show the display name next to the avatar (from `sm` up). */
  showName?: boolean;
  /** Sidebar: collapsed to icons — show the avatar only. */
  collapsed?: boolean;
  /** A notification bell sits next to the menu, so the avatar dot only needs to mean unread messages. */
  besideBell?: boolean;
}

const UserMenu = ({ user, variant = "header", showName = true, collapsed = false, besideBell = false }: UserMenuProps) => {
  const navigate = useNavigate();
  const logout = useLogout();
  const unread = useUnreadCount();
  const unreadNotifications = useNotificationUnread();
  const name = getDisplayName(user);
  const address = user.profile?.address;
  const location = [displayPlace(address?.city), formatNgState(address?.state)].filter(Boolean).join(", ");

  return (
    <DropdownMenu>
      {variant === "sidebar" ? (
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left outline-none transition-colors hover:bg-[#f6efe1]/10 focus-visible:ring-2 focus-visible:ring-[#f6efe1]/40 data-[state=open]:bg-[#f6efe1]/10",
            collapsed && "justify-center",
          )}
          aria-label="Open account menu"
          title={collapsed ? name : undefined}
        >
          <UserAvatar user={user} className="size-9 border-[#f6efe1]/20 bg-[#ece0c9]" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#f6efe1]">{name}</span>
                {location && <span className="block truncate text-xs text-[#f6efe1]/60">{location}</span>}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-[#f6efe1]/50" />
            </>
          )}
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-secondary"
          aria-label="Open account menu"
        >
          <span className="relative">
            <UserAvatar user={user} />
            {unread + (besideBell ? 0 : unreadNotifications) > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[#9c3a2c] ring-2 ring-background"
                aria-label={[unread && `${unread} unread messages`, !besideBell && unreadNotifications && `${unreadNotifications} unread notifications`].filter(Boolean).join(", ")}
              />
            )}
          </span>
          {showName && <span className="hidden max-w-36 truncate text-[15px] font-semibold sm:inline">{name}</span>}
          <ChevronDown className={cn("size-4 text-foreground/50", !showName && "hidden sm:block")} />
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent
        // Sidebar: open above the user block, matching its width when expanded.
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        sideOffset={8}
        className={cn(variant === "sidebar" && !collapsed && "w-(--radix-dropdown-menu-trigger-width) min-w-0")}
      >
        <DropdownMenuLabel className="flex items-center gap-3">
          <UserAvatar user={user} className="size-9" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{name}</span>
            <span className="block truncate text-xs text-foreground/55">{location || user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {USER_MENU_LINKS.map(({ label, to, icon: Icon }) => (
          <DropdownMenuItem key={to} onSelect={() => navigate(to)}>
            <Icon />
            {label}
            <UnreadBadge count={to === "/dashboard/messages" ? unread : to === "/dashboard/notifications" ? unreadNotifications : 0} className="ml-auto" />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
