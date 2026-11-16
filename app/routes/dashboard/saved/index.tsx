import { useEffect, useRef } from "react";
import { Link } from "react-router";
import BookCard, { BookCardSkeleton } from "~/components/shop/BookCard";
import { Button } from "~/components/ui/button";
import { useSavedBooks } from "~/hooks/useSaved";
import EmptyState from "../components/EmptyState";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4";

/** /dashboard/saved: every book the user hearted, newest first. Unsaving one drops it from the list. */
const SavedPage = () => {
    const query = useSavedBooks();
    const sentinel = useRef<HTMLDivElement>(null);
    const books = query.data?.pages.flatMap((page) => page.content) ?? [];
    const total = query.data?.pages[0]?.totalElements ?? 0;
    const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;

    useEffect(() => {
        document.title = "Saved books · Rebooked";
    }, []);

    // Load the next page as the end of the grid comes into view.
    useEffect(() => {
        const target = sentinel.current;
        if (!target || !hasNextPage || isError) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
            },
            { rootMargin: "600px 0px" },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError, books.length]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-3xl md:text-4xl">Saved books</h1>
                <p className="mt-1.5 text-foreground/60">
                    {total ? `${total} ${total === 1 ? "book" : "books"} you've saved` : "Books you've saved for later"}
                </p>
            </div>

            {query.isError && books.length === 0 ? (
                <EmptyState
                    title="We couldn't load your saved books"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => query.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : query.isLoading ? (
                <div aria-busy className={GRID}>
                    {Array.from({ length: 8 }, (_, index) => (
                        <BookCardSkeleton key={index} />
                    ))}
                </div>
            ) : books.length === 0 ? (
                <EmptyState
                    title="No saved books yet"
                    description="Tap the heart on any book to save it here for later."
                    action={
                        <Button asChild className="h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                            <Link to="/shop">Browse the shop</Link>
                        </Button>
                    }
                />
            ) : (
                <ul className={GRID}>
                    {books.map((book) => (
                        <li key={book.id}>
                            <BookCard book={book} />
                        </li>
                    ))}
                </ul>
            )}

            {hasNextPage && (
                <div ref={sentinel} className="py-8 text-center">
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-sm font-semibold text-primary hover:underline disabled:text-foreground/50 disabled:no-underline"
                    >
                        {isFetchingNextPage ? "Loading more…" : isError ? "Couldn't load more. Try again" : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SavedPage;
