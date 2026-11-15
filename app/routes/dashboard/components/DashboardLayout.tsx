import { Library, MessageSquare, Store, UserRound, type LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import UserMenu from "~/components/UserMenu";
import { useBaseStore } from "~/hooks/store";
import { cn } from "~/lib/utils";
import AuthProvider from "~/provider/AuthProvider";
import DashboardSidebar from "./DashboardSidebar";

const tabs: { label: string; to: string; icon: LucideIcon; end?: boolean }[] = [
    { label: "Store", to: "/shop", icon: Store },
    { label: "Listings", to: "/dashboard/listings", icon: Library },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Profile", to: "/dashboard/settings", icon: UserRound },
];

const DashboardShell = () => {
    const user = useBaseStore((state) => state.user);

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
                    {user && <UserMenu user={user} />}
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
                        <Icon className="size-5.5" />
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
