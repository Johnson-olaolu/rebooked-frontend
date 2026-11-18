"use client";

import { Link } from "react-router";
import BookShelf from "~/components/shop/BookShelf";
import { useHomepage } from "~/hooks/useHomepage";
import HomeBand from "./HomeBand";

/** Home "New arrivals" (API_CHANGES #24c). Shows a skeleton while the bundle loads; hidden when empty. */
const NewArrivals = ({ tinted }: { tinted?: boolean }) => {
    const query = useHomepage((homepage) => homepage.newArrivals);
    const books = query.data ?? [];
    if (!query.isLoading && books.length === 0) return null;

    return (
        <HomeBand tinted={tinted}>
            <BookShelf
                size="large"
                className=""
                eyebrow="Just shelved"
                title="New arrivals"
                description="The latest books looking for a second reader."
                action={
                    <Link to="/shop" className="font-semibold text-primary hover:underline">
                        See all →
                    </Link>
                }
                books={books}
                loading={query.isLoading}
                error={false}
                onRetry={() => undefined}
            />
        </HomeBand>
    );
};

export default NewArrivals;
