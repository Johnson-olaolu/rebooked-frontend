import BookShelf from "~/components/shop/BookShelf";
import { useHomepage } from "~/hooks/useHomepage";
import HomeBand from "./HomeBand";

/** Home "Trending this week" (API_CHANGES #24c): most viewed in the last 7 days. Hidden when empty. */
const TrendingShelf = ({ tinted }: { tinted?: boolean }) => {
    const { data: books } = useHomepage((homepage) => homepage.trending);
    if (!books?.length) return null;

    return (
        <HomeBand tinted={tinted}>
            <BookShelf
                size="large"
                className=""
                eyebrow="This week"
                title="Trending"
                description="What readers have been looking at most over the last 7 days."
                books={books}
                loading={false}
                error={false}
                onRetry={() => undefined}
            />
        </HomeBand>
    );
};

export default TrendingShelf;
