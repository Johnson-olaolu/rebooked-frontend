import { Link } from "react-router";
import { cn } from "~/lib/utils";
import type { IBook } from "~/types/book";
import { bookPath, conditionLabel } from "~/utils/book";
import { formatNaira } from "~/utils/money";
import { displayPlace } from "~/utils/text";

/** "Ibadan, Oyo" from the book's stored location, falling back to the seller's. */
export const bookPlace = (book: IBook) => {
    const city = book.location?.city ?? book.seller?.city;
    const state = book.location?.state ?? book.seller?.state;
    return [displayPlace(city), state?.trim()].filter(Boolean).join(", ");
};

/** 2a / 2f card: cover with condition pill, title, author, price and place. */
const BookCard = ({ book, sold = false }: { book: IBook; sold?: boolean }) => {
    const place = bookPlace(book);
    return (
        <Link
            to={bookPath(book)}
            className="group flex min-w-0 flex-col rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-foreground/10 bg-secondary">
                {book.coverImage?.url ? (
                    <img
                        src={book.coverImage.url}
                        alt=""
                        loading="lazy"
                        className={cn("size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]", sold && "opacity-60")}
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <img src="/brand/rebooked-mark-ink.png" alt="" className="h-10 w-auto opacity-25" />
                    </div>
                )}
                {book.condition && (
                    <span className="absolute top-2 right-2 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        {conditionLabel(book.condition)}
                    </span>
                )}
                {sold && (
                    <span className="absolute bottom-2 left-2 rounded bg-foreground px-2 py-0.5 text-[11px] font-bold tracking-wider text-background uppercase">
                        Sold
                    </span>
                )}
            </div>
            <div className="mt-2.5 truncate font-serif text-lg leading-snug group-hover:underline">{book.title}</div>
            {book.author && <div className="truncate text-sm text-foreground/60">{book.author}</div>}
            <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className={cn("font-serif text-lg text-primary", sold && "text-foreground/45")}>
                    {formatNaira(book.price, book.isFree)}
                </span>
                {place && <span className="truncate text-xs text-foreground/55">{place}</span>}
            </div>
        </Link>
    );
};

export const BookCardSkeleton = () => (
    <div aria-hidden>
        <div className="aspect-[3/4] animate-pulse rounded-lg bg-secondary" />
        <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-secondary" />
    </div>
);

export default BookCard;
