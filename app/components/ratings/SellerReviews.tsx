import { Link } from "react-router";
import UserAvatar from "~/components/UserAvatar";
import { useSellerReviews } from "~/hooks/useRatings";
import type { ISellerRating } from "~/types/user";
import { displayName } from "~/utils/text";
import { StarsDisplay } from "./Stars";

const reviewDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Seller page "Ratings": average, a 5→1 breakdown, then the newest reviews. */
const SellerReviews = ({ sellerId, rating, name }: { sellerId: string; rating?: ISellerRating | null; name: string }) => {
    const query = useSellerReviews(sellerId);
    const reviews = query.data?.pages.flatMap((page) => page.content) ?? [];
    const count = rating?.count ?? 0;

    return (
        <section id="seller-ratings" aria-labelledby="seller-ratings-title" className="mt-14 scroll-mt-6">
            <h2 id="seller-ratings-title" className="font-serif text-3xl">
                Ratings
            </h2>

            {count === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-10 text-center">
                    <p className="font-serif text-2xl">No ratings yet</p>
                    <p className="mt-2 text-foreground/60">Ratings come from people who bought from {name}.</p>
                </div>
            ) : (
                <div className="mt-5 grid gap-8 md:grid-cols-[240px_1fr] md:gap-12">
                    {/* Summary + breakdown */}
                    <div>
                        <div className="flex items-end gap-3">
                            <span className="font-serif text-5xl text-primary">{rating!.average.toFixed(1)}</span>
                            <span className="pb-1.5 text-sm text-foreground/60">out of 5</span>
                        </div>
                        <StarsDisplay value={rating!.average} className="mt-1" size="size-5" />
                        <p className="mt-1 text-sm text-foreground/60">
                            From {count} {count === 1 ? "buyer" : "buyers"}
                        </p>
                        {rating?.stars && (
                            <dl className="mt-4 space-y-1.5">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const n = rating.stars?.[String(stars) as "1"] ?? 0;
                                    const percent = count ? Math.round((n / count) * 100) : 0;
                                    return (
                                        <div key={stars} className="flex items-center gap-2 text-sm">
                                            <dt className="w-10 shrink-0 text-foreground/65">{stars} ★</dt>
                                            <dd className="flex flex-1 items-center gap-2">
                                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
                                                    <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                                                </span>
                                                <span className="w-6 text-right text-foreground/55">
                                                    {n}
                                                    <span className="sr-only"> {n === 1 ? "rating" : "ratings"}</span>
                                                </span>
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        )}
                    </div>

                    {/* Reviews */}
                    <div>
                        {query.isLoading ? (
                            <div aria-busy className="space-y-4">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <div key={index} className="h-20 animate-pulse rounded-lg bg-secondary" />
                                ))}
                            </div>
                        ) : query.isError && reviews.length === 0 ? (
                            <p className="text-foreground/60">
                                We couldn't load the reviews.{" "}
                                <button type="button" onClick={() => query.refetch()} className="font-semibold text-primary hover:underline">
                                    Try again
                                </button>
                            </p>
                        ) : (
                            <ul className="divide-y divide-foreground/8">
                                {reviews.map((review) => (
                                    <li key={review.id} className="py-4 first:pt-0">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar name={review.buyer.userName} photoUrl={review.buyer.profilePictureUrl} className="size-9 text-sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">{displayName(review.buyer.userName) || "A buyer"}</p>
                                                <p className="flex flex-wrap items-center gap-x-2 text-xs text-foreground/55">
                                                    <span role="img" aria-label={`${review.stars} out of 5`}>
                                                        <StarsDisplay value={review.stars} size="size-3.5" />
                                                    </span>
                                                    <span>{reviewDate(review.createdAt)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        {review.comment && <p className="mt-2 leading-relaxed text-foreground/85">{review.comment}</p>}
                                        {review.book?.title && (
                                            <p className="mt-1.5 text-xs text-foreground/55">
                                                Bought{" "}
                                                {review.book.id ? (
                                                    <Link to={`/book/${review.book.id}`} className="font-serif italic hover:underline">
                                                        {review.book.title}
                                                    </Link>
                                                ) : (
                                                    <span className="font-serif italic">{review.book.title}</span>
                                                )}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {query.hasNextPage && (
                            <button
                                type="button"
                                onClick={() => query.fetchNextPage()}
                                disabled={query.isFetchingNextPage}
                                className="mt-2 text-sm font-semibold text-primary hover:underline disabled:text-foreground/50"
                            >
                                {query.isFetchingNextPage ? "Loading…" : "Show more reviews"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default SellerReviews;
