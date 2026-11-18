"use client";

import { useNewArrivals } from "./NewArrivals";

/** CTA line with the live number of ACTIVE books (shares the New arrivals query). */
const ShelfCount = () => {
    const { data } = useNewArrivals();
    const total = data?.totalElements;

    return (
        <span className="text-foreground/65">
            {total ? (
                <>
                    <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
                    {total === 1 ? "book is" : "books are"} currently looking for a new reader.
                </>
            ) : (
                "Books are waiting for their next reader."
            )}
        </span>
    );
};

export default ShelfCount;
