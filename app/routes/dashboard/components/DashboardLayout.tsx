import { House, Library, MessageSquare, Store, UserRound, type LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import UnreadBadge from "~/components/chat/UnreadBadge";
import UserMenu from "~/components/UserMenu";
import { useUnreadCount } from "~/hooks/useChat";
import { useBaseStore } from "~/hooks/store";
import { cn } from "~/lib/utils";
import AuthProvider from "~/provider/AuthProvider";
import DashboardSidebar from "./DashboardSidebar";

const tabs: { label: string; to: string; icon: LucideIcon; end?: boolean }[] = [
    { label: "Home", to: "/dashboard", icon: House, end: true },
    { label: "Shelf", to: "/dashboard/shelf", icon: Library },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Profile", to: "/dashboard/settings", icon: UserRound },
];

const DashboardShell = () => {
    const user = useBaseStore((state) => state.user);
    const unread = useUnreadCount();

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop: collapsible sidebar (mockup 3a). */}
            <DashboardSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile: slim header (mockup 3f). */}
                <header className="sticky top-0 z-40 flex items-center justify-between border-b border-foreground/10 bg-card px-5 py-3 md:hidden">
                    <Link to="/dashboard" className="shrink-0">
                        <img src="/brand/rebooked-logo-ink.png" alt="Rebooked" className="h-8 w-auto object-contain" />
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* Shop sits up top in its own pill so it's always reachable. */}
                        <Link
                            to="/shop"
                            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                        >
                            <Store className="size-4" aria-hidden />
                            Shop
                        </Link>
                        {user && <UserMenu user={user} />}
                    </div>
                </header>

                {/* Bottom padding leaves room for the mobile tab bar. */}
                <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 pb-28 md:px-10 md:py-10 md:pb-12">
                    <Outlet />
                </main>
            </div>

            {/* Mobile: bottom tab bar (mockup 3f). */}
            <nav
                aria-label="Dashboard tabs"
                className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-foreground/15 bg-card px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
            >
                {tabs.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            cn(
                                "flex min-h-11 flex-col items-center justify-center gap-1 text-[11px]",
                                isActive ? "font-bold text-primary" : "text-foreground/50",
                            )
                        }
                    >
                        <span className="relative">
                            <Icon className="size-5.5" />
                            {to === "/dashboard/messages" && <UnreadBadge count={unread} className="absolute -top-1.5 -right-3 h-4 min-w-4 px-1 text-[10px]" />}
                        </span>
                        {label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

const DashboardLayout = () => (
    <AuthProvider onboarding="complete">
        <DashboardShell />
    </AuthProvider>
);

export default DashboardLayout;
