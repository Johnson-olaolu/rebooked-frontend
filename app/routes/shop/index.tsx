import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getDisplayName } from "~/components/UserAvatar";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { cn } from "~/lib/utils";

const CATEGORY_CHIPS = ["All", "Textbooks", "Fiction", "Near me"];

const primaryButton =
    "h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

const ShopPage = () => {
    const { user, isLoggedIn } = useCurrentUser();
    const [activeChip, setActiveChip] = useState("All");
    const firstName = getDisplayName(user).split(" ")[0];

    return (
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-12 md:py-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-4xl md:text-5xl">
                        {isLoggedIn && firstName ? `Find your next read, ${firstName}` : "Shop"}
                    </h1>
                    <p className="mt-2 text-foreground/65">
                        Second-hand books from people near you. Message the seller, meet up, done.
                    </p>
                </div>

                {isLoggedIn ? (
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="h-11 rounded-lg px-4 text-[15px] font-semibold">
                            <Link to="/dashboard/shelf">My shelf</Link>
                        </Button>
                        <Button className={primaryButton} onClick={() => toast("Adding books to your shelf is coming soon.")}>
                            + Add to shelf
                        </Button>
                    </div>
                ) : (
                    <Button asChild className={primaryButton}>
                        <Link to="/register">Join Rebooked to start your shelf</Link>
                    </Button>
                )}
            </div>

            <div className="mt-8 flex flex-col gap-4">
                <div className="relative max-w-xl">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                    <Input
                        disabled
                        placeholder="Search title, author or ISBN — coming soon"
                        className="h-11 bg-card pl-9"
                        aria-label="Search books (coming soon)"
                    />
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {CATEGORY_CHIPS.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            onClick={() => setActiveChip(chip)}
                            className={cn(
                                "rounded-full px-4 py-2 text-sm transition-colors",
                                chip === activeChip ? "bg-[#4a2d18] text-[#f6efe1]" : "bg-secondary hover:bg-secondary/70",
                            )}
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-16 text-center">
                <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto object-contain opacity-40" />
                <h2 className="mt-5 font-serif text-2xl">Nobody's shelved anything yet</h2>
                <p className="mt-2 max-w-md text-foreground/60">
                    The shop opens as soon as the first books hit the shelves.
                    {isLoggedIn ? " Got some books to pass on? Be the first." : " Join to be the first to fill a shelf."}
                </p>
            </div>
        </div>
    );
};

export default ShopPage;
