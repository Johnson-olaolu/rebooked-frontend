import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import BookCard, { BookCardSkeleton } from "~/components/shop/BookCard";
import ConfirmDialog from "~/components/ui/confirm-dialog";
import { useClearRecentlyViewed, useRecentlyViewed } from "~/hooks/useRecentlyViewed";
import { useSavedBooks } from "~/hooks/useSaved";
import type { IBook } from "~/types/book";

const RECENT_SHOWN = 10;
const SAVED_SHOWN = 6;

/** A titled row of book cards: scrolls sideways on small screens, wraps to a grid on large ones. */
const Shelf = ({
    title,
    action,
    books,
    loading,
    error,
    onRetry,
    empty,
}: {
    title: string;
    action?: ReactNode;
    books: IBook[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    empty: ReactNode;
}) => (
    <section aria-labelledby={`shelf-${title}`} className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id={`shelf-${title}`} className="font-serif text-2xl">
                {title}
            </h2>
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
                    </li>
                ))}
            </ul>
        )}
    </section>
);

const ShopLink = () => (
    <Link to="/shop" className="font-semibold text-primary hover:underline">
        Browse the shop
    </Link>
);

export const RecentlyViewedShelf = () => {
    const query = useRecentlyViewed();
    const clear = useClearRecentlyViewed();
    const [confirming, setConfirming] = useState(false);
    const books = (query.data ?? []).slice(0, RECENT_SHOWN);

    return (
        <>
            <Shelf
                title="Recently viewed"
                books={books}
                loading={query.isLoading}
                error={query.isError}
                onRetry={() => query.refetch()}
                action={
                    books.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="text-sm font-semibold text-foreground/60 hover:text-foreground hover:underline"
                        >
                            Clear
                        </button>
                    )
                }
                empty={
                    <>
                        Books you look at will show up here. <ShopLink />
                    </>
                }
            />
            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="Clear recently viewed?"
                description="This removes the list here. It doesn't affect your saved books."
                confirmLabel="Clear"
                pendingLabel="Clearing…"
                pending={clear.isPending}
                onConfirm={() => clear.mutate(undefined, { onSuccess: () => setConfirming(false) })}
            />
        </>
    );
};

export const SavedShelf = () => {
    const query = useSavedBooks();
    const first = query.data?.pages[0];
    const books = (first?.content ?? []).slice(0, SAVED_SHOWN);
    const total = first?.totalElements ?? 0;

    return (
        <Shelf
            title="Saved books"
            books={books}
            loading={query.isLoading}
            error={query.isError}
            onRetry={() => query.refetch()}
            action={
                total > 0 && (
                    <Link to="/dashboard/saved" className="text-sm font-semibold text-primary hover:underline">
                        See all{total > SAVED_SHOWN ? ` ${total}` : ""} →
                    </Link>
                )
            }
            empty={
                <>
                    Tap the heart on any book to save it for later. <ShopLink />
                </>
            }
        />
    );
};
