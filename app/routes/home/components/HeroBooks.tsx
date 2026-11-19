import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

/*
 * The hero stack is deliberately NOT store data. Seller-uploaded covers vary in quality and
 * this is the most prominent image on the site, so it uses curated photography from
 * public/hero (see public/hero/CREDITS.md). Nothing here touches GET /homepage.
 *
 * The photographs carry no legible title, so the caption names a public-domain classic
 * without contradicting the image. No price and no listing link: these aren't listings.
 */
const HERO_BOOKS = [
    { src: "/hero/cover-01.webp", title: "Pride and Prejudice", author: "Jane Austen" },
    { src: "/hero/cover-02.webp", title: "Moby-Dick", author: "Herman Melville" },
    { src: "/hero/cover-03.webp", title: "Jane Eyre", author: "Charlotte Brontë" },
    { src: "/hero/cover-04.webp", title: "Great Expectations", author: "Charles Dickens" },
    { src: "/hero/cover-05.webp", title: "The Age of Innocence", author: "Edith Wharton" },
];

const ADVANCE_MS = 4000;

/*
 * Slot 0 is the front card, 1 and 2 are the tilted covers behind it, and everything else is
 * parked behind the front card at zero opacity waiting its turn. Cards keep their DOM
 * position and only swap slots, so the transition on each card animates the travel for free.
 */
const SLOTS = [
    "z-30 translate-x-20 translate-y-14 rotate-0 scale-100 opacity-100",
    "z-10 translate-x-0 translate-y-4 -rotate-12 scale-[0.86] opacity-100",
    "z-20 translate-x-40 translate-y-0 rotate-6 scale-[0.92] opacity-100",
];
const PARKED = "z-0 translate-x-20 translate-y-14 rotate-0 scale-90 opacity-0";

const HeroBooks = () => {
    const [cycle, setCycle] = useState(0);
    const paused = useRef(false);

    useEffect(() => {
        // Same reduced-motion contract as StatsStrip: no automatic movement at all.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const id = setInterval(() => {
            if (!paused.current) setCycle((value) => value + 1);
        }, ADVANCE_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            className="relative hidden h-[380px] md:block"
            onMouseEnter={() => (paused.current = true)}
            onMouseLeave={() => (paused.current = false)}
            onFocusCapture={() => (paused.current = true)}
            onBlurCapture={() => (paused.current = false)}
        >
            {HERO_BOOKS.map((book, index) => {
                const slot = (index - cycle + HERO_BOOKS.length * 1000) % HERO_BOOKS.length;
                const isFront = slot === 0;

                return (
                    <Link
                        key={book.src}
                        to="/shop"
                        aria-hidden={!isFront}
                        tabIndex={isFront ? undefined : -1}
                        className={`group absolute top-0 left-0 flex h-[310px] w-[214px] origin-bottom flex-col gap-3 rounded-l-sm rounded-r-md border border-foreground/15 bg-card p-4 shadow-2xl transition-all duration-500 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                            isFront ? "" : "pointer-events-none"
                        } ${SLOTS[slot] ?? PARKED}`}
                    >
                        <div className="min-h-0 flex-1 overflow-hidden rounded bg-background">
                            <img
                                src={book.src}
                                alt={isFront ? `${book.title} by ${book.author}` : ""}
                                loading={index === 0 ? "eager" : "lazy"}
                                className="size-full object-cover"
                            />
                        </div>
                        {/* Text rides along on every card but only reads on the front one. */}
                        <div className={`min-w-0 transition-opacity duration-300 ${isFront ? "opacity-100" : "opacity-0"}`}>
                            <div className="truncate font-serif text-lg group-hover:underline">{book.title}</div>
                            <div className="mt-1 truncate text-xs text-foreground/55">{book.author}</div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default HeroBooks;
