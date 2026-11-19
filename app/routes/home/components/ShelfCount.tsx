import { useHomepage } from "~/hooks/useHomepage";

/** CTA line with the live number of ACTIVE books (`stats.activeBooks`, API_CHANGES #24c). */
const ShelfCount = () => {
    const { data: total } = useHomepage((homepage) => homepage.stats?.activeBooks);

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
