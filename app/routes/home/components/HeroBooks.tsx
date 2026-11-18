"use client";

import { Link } from "react-router";
import { useHomepage } from "~/hooks/useHomepage";
import type { IBook } from "~/types/book";
import { authorLine } from "~/utils/author";
import { bookPath, conditionLabel } from "~/utils/book";
import { formatNaira } from "~/utils/money";

/** Placeholder stack shown until this week's hero books load, or when there are none with covers. */
const DecorativeCovers = () => (
    <div aria-hidden className="relative hidden h-[380px] md:block">
        <div className="absolute top-6 left-8 h-[260px] w-[176px] -rotate-6 rounded-l border border-foreground/15 bg-secondary shadow-xl" />
        <div className="absolute top-1 left-28 h-[280px] w-[190px] rotate-3 rounded-l bg-olive shadow-xl" />
        <div className="absolute top-12 left-16 flex h-[310px] w-[214px] flex-col gap-3 rounded-l-sm rounded-r-md border border-foreground/15 bg-card p-4 shadow-2xl">
            <div className="flex flex-1 items-center justify-center rounded border border-dashed border-foreground/25 bg-background text-xs text-foreground/45">
                Cover photo
            </div>
            <div>
                <div className="font-serif text-lg">The Bell Jar</div>
                <div className="mt-1 text-xs text-foreground/55">Sylvia Plath · Good condition</div>
            </div>
            <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold text-primary">₦3,500</span>
                <span className="text-[11px] tracking-wide text-olive uppercase">Local pickup</span>
            </div>
        </div>
        <img src="/brand/rebooked-mark-ink.png" alt="" className="absolute right-0 bottom-0 h-20 w-32 object-contain opacity-10" />
    </div>
);

/** A tilted cover behind the front card. */
const BackCover = ({ book, className }: { book: IBook; className: string }) => (
    <Link
        to={bookPath(book)}
        tabIndex={-1}
        aria-hidden
        className={`absolute overflow-hidden rounded-l border border-foreground/15 bg-secondary shadow-xl transition-transform hover:-translate-y-1 ${className}`}
    >
        <img src={book.coverImage!.url} alt="" className="size-full object-cover" />
    </Link>
);

/** Hero right-hand side: this week's three hero books (API_CHANGES #24d), fanned like a stack. */
const HeroBooks = () => {
    const { data } = useHomepage((homepage) => homepage.hero.filter((book) => book.coverImage?.url));
    const books = data ?? [];
    if (books.length === 0) return <DecorativeCovers />;

    const [front, left, right] = books;
    const authors = authorLine(front.authors);
    const condition = front.condition ? conditionLabel(front.condition) : null;

    return (
        <div className="relative hidden h-[380px] md:block">
            {left && <BackCover book={left} className="top-6 left-8 h-[260px] w-[176px] -rotate-6" />}
            {right && <BackCover book={right} className="top-1 left-28 h-[280px] w-[190px] rotate-3" />}
            <Link
                to={bookPath(front)}
                className="group absolute top-12 left-16 flex h-[310px] w-[214px] flex-col gap-3 rounded-l-sm rounded-r-md border border-foreground/15 bg-card p-4 shadow-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
                <div className="min-h-0 flex-1 overflow-hidden rounded bg-background">
                    <img src={front.coverImage!.url} alt="" className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                    <div className="truncate font-serif text-lg group-hover:underline">{front.title}</div>
                    <div className="mt-1 truncate text-xs text-foreground/55">{[authors, condition].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-semibold text-primary">{formatNaira(front.price, front.isFree)}</span>
                    <span className="text-[11px] tracking-wide text-olive uppercase">This week</span>
                </div>
            </Link>
        </div>
    );
};

export default HeroBooks;
