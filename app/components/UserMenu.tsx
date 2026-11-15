import { ChevronDown, LayoutDashboard, Library, LogOut, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useLogout } from "~/hooks/useLogout";
import { cn } from "~/lib/utils";
import type { IUser } from "~/types/user";
import UserAvatar, { getDisplayName } from "./UserAvatar";

export const USER_MENU_LINKS = [
  { label: "My dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My listings", to: "/dashboard/listings", icon: Library },
  { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
  { label: "Profile settings", to: "/dashboard/settings", icon: Settings },
];

interface UserMenuProps {
  user: IUser;
  /** Show the display name next to the avatar (from `sm` up). */
  showName?: boolean;
}

const UserMenu = ({ user, showName = true }: UserMenuProps) => {
  const navigate = useNavigate();
  const logout = useLogout();
  const name = getDisplayName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-secondary"
        aria-label="Open account menu"
      >
        <UserAvatar user={user} />
        {showName && <span className="hidden max-w-36 truncate text-[15px] font-semibold sm:inline">{name}</span>}
        <ChevronDown className={cn("size-4 text-foreground/50", !showName && "hidden sm:block")} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-3">
          <UserAvatar user={user} className="size-9" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{name}</span>
            <span className="block truncate text-xs text-foreground/55">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {USER_MENU_LINKS.map(({ label, to, icon: Icon }) => (
          <DropdownMenuItem key={to} onSelect={() => navigate(to)}>
            <Icon />
            {label}
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
