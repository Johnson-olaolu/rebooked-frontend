import {
    Bell,
    LayoutDashboard,
    Library,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    Store,
    type LucideIcon,
} from "lucide-react";
import { Link, NavLink } from "react-router";
import UnreadBadge from "~/components/chat/UnreadBadge";
import UserMenu from "~/components/UserMenu";
import { useUnreadCount } from "~/hooks/useChat";
import { useNotificationUnread } from "~/hooks/useNotifications";
import { useBaseStore } from "~/hooks/store";
import { cn } from "~/lib/utils";

export const SIDEBAR_ITEMS: { label: string; to: string; icon: LucideIcon; end?: boolean }[] = [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
    { label: "My shelf", to: "/dashboard/shelf", icon: Library },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
    { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

/** Dashboard sidebar from mockup 3a, collapsible to an icon rail (desktop only). */
const DashboardSidebar = () => {
    const user = useBaseStore((state) => state.user);
    const collapsed = useBaseStore((state) => state.sidebarCollapsed);
    const toggleSidebar = useBaseStore((state) => state.toggleSidebar);
    const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
    const unreadMessages = useUnreadCount();
    const unreadNotifications = useNotificationUnread();
    const countFor = (to: string) =>
        to === "/dashboard/messages" ? unreadMessages : to === "/dashboard/notifications" ? unreadNotifications : 0;

    return (
        <aside
            aria-label="Dashboard"
            data-collapsed={collapsed}
            className={cn(
                "sticky top-0 hidden h-screen shrink-0 flex-col gap-6 overflow-hidden bg-[#4a2d18] py-5.5 text-[#f6efe1] transition-[width] duration-200 ease-out md:flex",
                collapsed ? "w-19 px-3" : "w-58 px-4.5",
            )}
        >
            <div className={cn("flex items-center", collapsed ? "flex-col gap-4" : "justify-between gap-2")}>
                <Link to="/dashboard" className="shrink-0" aria-label="Rebooked dashboard">
                    {collapsed ? (
                        <img src="/brand/rebooked-mark-cream.png" alt="" className="h-8 w-10 object-contain" />
                    ) : (
                        <img src="/brand/rebooked-logo-cream.png" alt="Rebooked" className="h-8.5 w-auto object-contain" />
                    )}
                </Link>
                <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!collapsed}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex size-8 items-center justify-center rounded-md text-[#f6efe1]/60 transition-colors hover:bg-[#f6efe1]/10 hover:text-[#f6efe1]"
                >
                    <ToggleIcon className="size-4.5" />
                </button>
            </div>

            {/* Shop gets its own section so it's always one click away. */}
            <div className="border-b border-[#f6efe1]/12 pb-5">
                <Link
                    to="/shop"
                    title={collapsed ? "Browse the shop" : undefined}
                    className={cn(
                        "flex items-center gap-3 rounded-lg bg-[#f6efe1] py-2.5 text-[15px] font-semibold text-[#4a2d18] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6efe1]/90",
                        collapsed ? "justify-center px-0" : "px-3",
                    )}
                >
                    <Store className="size-4.5 shrink-0" aria-hidden />
                    <span className={cn("truncate", collapsed && "sr-only")}>Browse the shop</span>
                </Link>
            </div>

            <nav className="-mt-1 flex flex-col gap-1">
                {SIDEBAR_ITEMS.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-md py-2.5 text-[15px] transition-colors",
                                collapsed ? "justify-center px-0" : "px-3",
                                isActive
                                    ? "bg-[#f6efe1]/14 font-semibold text-[#f6efe1]"
                                    : "text-[#f6efe1]/72 hover:bg-[#f6efe1]/8 hover:text-[#f6efe1]",
                            )
                        }
                    >
                        <span className="relative shrink-0">
                            <Icon className="size-4.5" aria-hidden />
                            {collapsed && countFor(to) > 0 && (
                                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#c4513f] ring-2 ring-[#4a2d18]" aria-hidden />
                            )}
                        </span>
                        <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
                        <UnreadBadge count={countFor(to)} className={cn("ml-auto bg-[#c4513f]", collapsed && "sr-only")} />
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-4">
                {!collapsed && user && !user.profile?.profilePictureUrl && (
                    <Link
                        to="/dashboard/settings"
                        className="rounded-lg bg-[#f6efe1]/8 p-3.5 text-[13px] leading-relaxed text-[#f6efe1]/75 transition-colors hover:bg-[#f6efe1]/12"
                    >
                        <span className="font-semibold text-[#f6efe1]">Add a profile photo.</span> Buyers reply more often
                        to a face.
                    </Link>
                )}
                {user && <UserMenu user={user} variant="sidebar" collapsed={collapsed} />}
            </div>
        </aside>
    );
};

export default DashboardSidebar;
