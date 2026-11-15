import { Library, MessageSquare, Store, UserRound, type LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { listBookSoon } from "./actions";
import { Button } from "~/components/ui/button";
import UserMenu from "~/components/UserMenu";
import { useBaseStore } from "~/hooks/store";
import { cn } from "~/lib/utils";
import AuthProvider from "~/provider/AuthProvider";

const topLinks = [
    { label: "Overview", to: "/dashboard", end: true },
    { label: "My listings", to: "/dashboard/listings" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Store", to: "/shop" },
];

const tabs: { label: string; to: string; icon: LucideIcon; end?: boolean }[] = [
    { label: "Store", to: "/shop", icon: Store },
    { label: "Listings", to: "/dashboard/listings", icon: Library },
    { label: "Messages", to: "/dashboard/messages", icon: MessageSquare },
    { label: "Profile", to: "/dashboard/settings", icon: UserRound },
];


const DashboardShell = () => {
    const user = useBaseStore((state) => state.user);

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-foreground/10 bg-card">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3 md:px-8">
                    <div className="flex items-center gap-7">
                        <Link to="/dashboard" className="shrink-0">
                            <img src="/brand/rebooked-logo-ink.png" alt="Rebooked" className="h-8 w-auto object-contain" />
                        </Link>
                        <nav className="hidden items-center gap-5.5 text-[15px] md:flex">
                            {topLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.end}
                                    className={({ isActive }) =>
                                        cn(
                                            "border-b-2 pb-0.5 transition-colors",
                                            isActive
                                                ? "border-primary font-semibold text-foreground"
                                                : "border-transparent text-foreground/70 hover:text-foreground",
                                        )
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={listBookSoon}
                            className="hidden h-10 rounded-md bg-primary px-4.5 text-[14.5px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90 md:inline-flex"
                        >
                            + List a book
                        </Button>
                        {user && <UserMenu user={user} />}
                    </div>
                </div>
            </header>

            {/* Bottom padding leaves room for the mobile tab bar. */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 pb-28 md:px-8 md:py-10 md:pb-12">
                <Outlet />
            </main>

            <nav
                aria-label="Dashboard"
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
