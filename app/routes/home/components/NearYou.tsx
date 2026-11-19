import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import BookShelf from "~/components/shop/BookShelf";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import bookService from "~/services/book.service";
import { formatNgState, normalizeNgState } from "~/utils/nigeria";
import { statePath } from "~/utils/slug";
import HomeBand from "./HomeBand";

const SHOWN = 12;

/** Home "Near you": books in the signed-in reader's state. Hidden without a state or without books there. */
const NearYou = ({ tinted }: { tinted?: boolean }) => {
    const { user } = useCurrentUser();
    const myState = normalizeNgState(user?.profile?.address?.state);
    const query = useQuery({
        queryKey: ["home", "near-you", myState],
        queryFn: () =>
            bookService.query({ states: [myState!], sort: "NEWEST", pageSize: SHOWN }).then((response) => response.data?.content ?? []),
        enabled: !!myState,
        staleTime: 5 * 60 * 1000,
    });
    const books = query.data ?? [];
    if (!myState || (query.isSuccess && books.length === 0)) return null;

    return (
        <HomeBand tinted={tinted}>
            <BookShelf
                size="large"
                className=""
                eyebrow="Local pickup"
                title={`Near you in ${formatNgState(myState)}`}
                description="Books you could collect this week."
                action={
                    <Link to={statePath(myState)} className="font-semibold text-primary hover:underline">
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

export default NearYou;
