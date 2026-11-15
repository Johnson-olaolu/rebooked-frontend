import { Link, NavLink } from "react-router";
import { Button } from "~/components/ui/button";
import UserMenu from "~/components/UserMenu";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { cn } from "~/lib/utils";

const navLinks = [
    { label: "Shop", to: "/shop" },
    { label: "How it works", to: "/#how-it-works" },
    { label: "About us", to: "/about-us" },
];

const Header = () => {
    const { user, isLoggedIn } = useCurrentUser();

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-12">
                <Link to="/" className="shrink-0">
                    <img src="/brand/rebooked-logo-ink.png" alt="Rebooked" className="h-9 w-auto object-contain" />
                </Link>

                <nav className="hidden items-center gap-8 text-[15px] md:flex">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            className={({ isActive }) =>
                                cn(
                                    "border-b-2 pb-0.5 transition-colors",
                                    isActive && !link.to.includes("#")
                                        ? "border-primary font-semibold text-foreground"
                                        : "border-transparent text-foreground/75 hover:text-foreground",
                                )
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    {isLoggedIn && user ? (
                        <UserMenu user={user} />
                    ) : (
                        <>
                            <Button
                                asChild
                                variant="outline"
                                className="hidden h-10 rounded-lg px-4 text-[15px] font-semibold sm:inline-flex"
                            >
                                <Link to="/login">Log in</Link>
                            </Button>
                            <Button
                                asChild
                                className="h-10 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                            >
                                <Link to="/register">Join Rebooked</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile: keep Shop reachable without the desktop nav. */}
            <nav className="flex items-center gap-6 overflow-x-auto border-t border-border px-6 py-2.5 text-sm md:hidden">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end
                        className={({ isActive }) =>
                            cn(
                                "whitespace-nowrap",
                                isActive && !link.to.includes("#") ? "font-semibold text-primary" : "text-foreground/70",
                            )
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default Header;
