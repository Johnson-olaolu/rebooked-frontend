import { useState } from "react";
import { Link } from "react-router";
import Shelf from "~/components/shop/BookShelf";
import ConfirmDialog from "~/components/ui/confirm-dialog";
import { useClearRecentlyViewed, useRecentlyViewed } from "~/hooks/useRecentlyViewed";
import { useSavedBooks } from "~/hooks/useSaved";

const RECENT_SHOWN = 10;
const SAVED_SHOWN = 6;

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
