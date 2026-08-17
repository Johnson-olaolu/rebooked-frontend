import { Link } from "react-router";
import { Button } from "~/components/ui/button";

const Header = () => {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-12">
                <Link to="/" className="shrink-0">
                    <img
                        src="/brand/rebooked-logo-ink.png"
                        alt="Rebooked"
                        className="h-9 w-auto object-contain"
                    />
                </Link>

                <nav className="hidden items-center gap-8 text-[15px] text-foreground/75 md:flex">
                    <Link to="/#how-it-works" className="transition-colors hover:text-foreground">
                        How it works
                    </Link>
                    <Link to="/about-us" className="transition-colors hover:text-foreground">
                        About us
                    </Link>
                    <Link to="/auth/login" className="transition-colors hover:text-foreground">
                        Log in
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" className="hidden h-10 rounded-lg px-4 text-[15px] font-semibold sm:inline-flex">
                        <Link to="/auth/login">Log in</Link>
                    </Button>
                    <Button asChild className="h-10 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
                        <Link to="/auth/register">Join Rebooked</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
