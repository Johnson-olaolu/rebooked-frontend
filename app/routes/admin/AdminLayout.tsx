import { Link, NavLink, Outlet } from "react-router";
import UserMenu from "~/components/UserMenu";
import { useBaseStore } from "~/hooks/store";
import { useRedirectOnce } from "~/hooks/useRedirectOnce";
import { cn } from "~/lib/utils";
import AuthProvider from "~/provider/AuthProvider";
import { isAdmin } from "~/utils/roles";

const ADMIN_TABS = [
    { label: "Authors", to: "/admin/authors", end: true },
    { label: "Review queue", to: "/admin/authors/review" },
    { label: "Imports", to: "/admin/imports" },
];

const AdminShell = () => {
    const user = useBaseStore((state) => state.user);
    const admin = isAdmin(user);
    useRedirectOnce(!!user && !admin, "/dashboard");
    if (!user || !admin) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-foreground/10 bg-card">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-10">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="shrink-0" aria-label="Back to your dashboard">
                            <img src="/brand/rebooked-logo-ink.png" alt="Rebooked" className="h-8 w-auto object-contain" />
                        </Link>
                        <span className="rounded-full bg-[#4a2d18] px-2.5 py-0.5 text-xs font-bold tracking-wider text-[#f6efe1] uppercase">
                            Admin
                        </span>
                    </div>
                    <UserMenu user={user} />
                </div>
                <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 md:px-8">
                    {ADMIN_TABS.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            end={tab.end}
                            className={({ isActive }) =>
                                cn(
                                    "shrink-0 border-b-2 px-3 py-2.5 text-[15px] whitespace-nowrap transition-colors",
                                    isActive ? "border-primary font-semibold text-foreground" : "border-transparent text-foreground/60 hover:text-foreground",
                                )
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
            </header>
            <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-10">
                <Outlet />
            </main>
        </div>
    );
};

/** /admin/*: super admin only (API_CHANGES #23f). Everyone else goes back to the dashboard. */
const AdminLayout = () => (
    <AuthProvider onboarding="complete">
        <AdminShell />
    </AuthProvider>
);

export default AdminLayout;
