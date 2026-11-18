import { useId, type ReactNode } from "react";
import BookCard, { BookCardSkeleton } from "~/components/shop/BookCard";
import { cn } from "~/lib/utils";
import type { IBook } from "~/types/book";

export interface BookShelfProps {
    title: string;
    /** Small uppercase line above the title (home page sections). */
    eyebrow?: ReactNode;
    /** One line under the title. */
    description?: ReactNode;
    /** Right-aligned next to the title, e.g. a "See all" link. */
    action?: ReactNode;
    books: IBook[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    /** Shown when there are no books. Omit to render nothing at all instead. */
    empty?: ReactNode;
    /** `large` matches the home page section headings; `default` the dashboard. */
    size?: "default" | "large";
    className?: string;
    /** Rendered under each card, e.g. an AI pick's reason. */
    caption?: (book: IBook) => ReactNode;
}

/** A titled row of book cards: scrolls sideways on small screens, wraps to a grid on large ones. */
const BookShelf = ({
    title,
    eyebrow,
    description,
    action,
    books,
    loading,
    error,
    onRetry,
    empty,
    size = "default",
    className = "mt-10",
    caption,
}: BookShelfProps) => {
    const headingId = useId();
    if (!loading && !error && books.length === 0 && empty === undefined) return null;

    return (
        <section aria-labelledby={headingId} aria-busy={loading} className={className}>
            <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-2", size === "large" ? "mb-6" : "mb-3")}>
                <div>
                    {eyebrow && <div className="text-xs font-semibold tracking-[0.14em] text-destructive uppercase">{eyebrow}</div>}
                    <h2 id={headingId} className={cn("font-serif", size === "large" ? "mt-2 text-3xl md:text-4xl" : "text-2xl")}>
                        {title}
                    </h2>
                    {description && <p className="mt-1.5 text-foreground/60">{description}</p>}
                </div>
                {action}
            </div>
            {loading ? (
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="w-36 shrink-0 md:w-44">
                            <BookCardSkeleton />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <p className="rounded-lg border border-dashed border-foreground/20 bg-card px-5 py-6 text-sm text-foreground/60">
                    We couldn't load these.{" "}
                    <button type="button" onClick={onRetry} className="font-semibold text-primary hover:underline">
                        Try again
                    </button>
                </p>
            ) : books.length === 0 ? (
                <div className="rounded-lg border border-dashed border-foreground/20 bg-card px-5 py-6 text-sm text-foreground/60">{empty}</div>
            ) : (
                <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:-mx-1 md:scroll-px-1 md:px-1">
                    {books.map((book) => (
                        <li key={book.id} className="w-36 shrink-0 snap-start md:w-44">
                            <BookCard book={book} />
                            {caption?.(book)}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default BookShelf;
