"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import BookShelf from "~/components/shop/BookShelf";
import bookService from "~/services/book.service";
import HomeBand from "./HomeBand";

const SHOWN = 12;

/**
 * The newest ACTIVE books. Its `totalElements` is also the live "books in the store" count,
 * so the CTA strip shares this query instead of making its own.
 */
export const useNewArrivals = () =>
    useQuery({
        queryKey: ["home", "new-arrivals"],
        queryFn: () => bookService.query({ sort: "NEWEST", pageSize: SHOWN }).then((response) => response.data),
        staleTime: 5 * 60 * 1000,
    });

/** Home "New arrivals". Hidden when the store is empty. */
const NewArrivals = ({ tinted }: { tinted?: boolean }) => {
    const query = useNewArrivals();
    const books = query.data?.content ?? [];
    if (query.isSuccess && books.length === 0) return null;

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
                error={query.isError}
                onRetry={() => query.refetch()}
            />
        </HomeBand>
    );
};

export default NewArrivals;
