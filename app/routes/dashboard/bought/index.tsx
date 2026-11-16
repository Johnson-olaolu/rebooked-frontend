import { Star } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import RateSellerForm from "~/components/ratings/RateSellerForm";
import { STAR_LABELS } from "~/components/ratings/Stars";
import { Button } from "~/components/ui/button";
import UserAvatar from "~/components/UserAvatar";
import { usePurchaseRating } from "~/hooks/useRatings";
import { firstName, threadPath } from "~/utils/chat";
import { getErrorStatus } from "~/utils/https";
import { displayName } from "~/utils/text";
import EmptyState from "../components/EmptyState";

const Card = ({ children }: { children: ReactNode }) => (
    <div className="rounded-xl border border-foreground/10 bg-card p-6">{children}</div>
);

/**
 * /dashboard/bought/:bookId, where "Rate the seller" emails and notifications land: the rating form,
 * or the rating already given (API_CHANGES #22).
 */
const BoughtPage = () => {
    const { bookId = "" } = useParams();
    const query = usePurchaseRating(bookId);
    const [editing, setEditing] = useState(false);
    const data = query.data;

    useEffect(() => {
        document.title = data ? `${data.book.title} · Rebooked` : "Your purchase · Rebooked";
    }, [data]);

    if (query.isLoading) {
        return (
            <div aria-busy className="mx-auto max-w-xl space-y-4">
                <div className="h-24 animate-pulse rounded-xl bg-secondary" />
                <div className="h-56 animate-pulse rounded-xl bg-secondary" />
            </div>
        );
    }

    if (!data) {
        const missing = [403, 404].includes(getErrorStatus(query.error) ?? 0);
        return (
            <div className="mx-auto max-w-xl">
                <EmptyState
                    title={missing ? "We couldn't find that sale" : "We couldn't load this"}
                    description={missing ? "The book may have been removed." : "Check your connection and try again."}
                    action={
                        missing ? (
                            <Button asChild variant="outline" className="h-11 rounded-md px-5 font-semibold">
                                <Link to="/dashboard/notifications">Back to notifications</Link>
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => query.refetch()} className="h-11 rounded-md px-5 font-semibold">
                                Try again
                            </Button>
                        )
                    }
                />
            </div>
        );
    }

    const seller = displayName(data.seller.userName) || "the seller";
    const sellerFirst = firstName(data.seller.userName);
    const rating = data.rating;

    let body: ReactNode;
    if (data.canRate) {
        body =
            rating && !editing ? (
                <Card>
                    <h2 className="font-serif text-2xl">Thanks for rating {sellerFirst}</h2>
                    <p className="mt-3 flex items-center gap-2" aria-label={`You gave ${rating.stars} out of 5`}>
                        <span className="inline-flex gap-0.5" aria-hidden>
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star key={index} className={index < rating.stars ? "size-5 fill-primary text-primary" : "size-5 text-foreground/25"} />
                            ))}
                        </span>
                        <span className="text-sm font-semibold text-foreground/70">{STAR_LABELS[rating.stars - 1]}</span>
                    </p>
                    {rating.comment && <p className="mt-3 leading-relaxed text-foreground/80">“{rating.comment}”</p>}
                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <Button type="button" variant="outline" onClick={() => setEditing(true)} className="h-11 rounded-md px-5 font-semibold">
                            Edit rating
                        </Button>
                        <Button asChild variant="ghost" className="h-11 rounded-md px-4 font-semibold">
                            <Link to={`/seller/${data.seller.id}`}>See {sellerFirst}'s profile</Link>
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card>
                    <h2 className="mb-4 font-serif text-2xl">{rating ? `Edit your rating of ${sellerFirst}` : `Rate ${sellerFirst}`}</h2>
                    <RateSellerForm
                        key={rating?.updatedAt ?? "new"}
                        bookId={bookId}
                        data={data}
                        onDone={() => setEditing(false)}
                        secondary={
                            rating ? (
                                <Button type="button" variant="outline" onClick={() => setEditing(false)} className="h-12 flex-1 rounded-lg font-semibold">
                                    Cancel
                                </Button>
                            ) : undefined
                        }
                    />
                </Card>
            );
    } else {
        body = (
            <EmptyState
                title="Nothing to rate here"
                description={`Only the person ${sellerFirst} marked as the buyer can rate this sale.`}
                action={
                    <Button asChild className="h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
                        <Link to="/shop">Browse the shop</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className="mx-auto flex max-w-xl flex-col gap-5">
            <div className="flex items-center gap-4">
                {data.book.coverUrl ? (
                    <img src={data.book.coverUrl} alt="" className="h-24 w-16 shrink-0 rounded-md object-cover" />
                ) : (
                    <div className="h-24 w-16 shrink-0 rounded-md bg-secondary" aria-hidden />
                )}
                <div className="min-w-0">
                    <h1 className="font-serif text-3xl break-words">
                        {data.book.slug || data.book.id ? (
                            <Link to={`/book/${data.book.id}`} className="hover:underline">
                                {data.book.title}
                            </Link>
                        ) : (
                            data.book.title
                        )}
                    </h1>
                    <Link to={`/seller/${data.seller.id}`} className="mt-1.5 inline-flex items-center gap-2 text-foreground/65 hover:text-foreground">
                        <UserAvatar name={data.seller.userName} photoUrl={data.seller.profilePictureUrl} className="size-6 text-[10px]" />
                        Sold by {seller}
                    </Link>
                </div>
            </div>
            {body}
            {data.conversationId && data.canRate && (
                <Link to={threadPath(data.conversationId, data.book.id)} className="text-center text-sm font-semibold text-foreground/60 hover:text-primary">
                    Open your chat with {sellerFirst} →
                </Link>
            )}
        </div>
    );
};

export default BoughtPage;
