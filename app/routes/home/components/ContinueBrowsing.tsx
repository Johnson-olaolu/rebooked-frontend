import { Link } from "react-router";
import BookShelf from "~/components/shop/BookShelf";
import { useRecentlyViewed } from "~/hooks/useRecentlyViewed";
import HomeBand from "./HomeBand";

const SHOWN = 10;

/** Home "Continue browsing": the signed-in reader's recently viewed books. Hidden when signed out or empty. */
const ContinueBrowsing = ({ tinted }: { tinted?: boolean }) => {
    const query = useRecentlyViewed();
    const books = (query.data ?? []).slice(0, SHOWN);
    // Disabled when signed out: the query never leaves `pending`, so key off `isLoading` (fetching) only.
    if (!query.isLoading && books.length === 0) return null;

    return (
        <HomeBand tinted={tinted}>
            <BookShelf
                size="large"
                className=""
                eyebrow="Pick up where you left off"
                title="Continue browsing"
                action={
                    <Link to="/dashboard" className="font-semibold text-primary hover:underline">
                        Your shelf →
                    </Link>
                }
                books={books}
                loading={query.isLoading}
                error={query.isError}
                onRetry={() => query.refetch()}
            />
        </HomeBand>
    );
};

export default ContinueBrowsing;
