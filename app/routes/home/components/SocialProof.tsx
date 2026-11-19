import { Link } from "react-router";
import SellerRating from "~/components/ratings/SellerRating";
import { StarsDisplay } from "~/components/ratings/Stars";
import UserAvatar from "~/components/UserAvatar";
import { useHomepage } from "~/hooks/useHomepage";
import { cn } from "~/lib/utils";
import type { IHomepageReview } from "~/types/homepage";
import type { ISellerProfile } from "~/types/user";
import { bookPath } from "~/utils/book";
import { displayName, displayPlace } from "~/utils/text";
import HomeBand from "./HomeBand";

const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" });

const ReviewCard = ({ review }: { review: IHomepageReview }) => (
    <figure className="flex flex-col rounded-xl border border-border bg-card p-5">
        <StarsDisplay value={review.rating} />
        <blockquote className="mt-3 flex-1 text-foreground/80">“{review.comment}”</blockquote>
        <figcaption className="mt-4 flex items-center gap-3 text-sm">
            <UserAvatar name={review.reviewer.userName} photoUrl={review.reviewer.profilePictureUrl} />
            <span className="min-w-0">
                <span className="font-semibold">{displayName(review.reviewer.userName) || "A reader"}</span>
                <span className="text-foreground/55"> · {dateFormat.format(new Date(review.createdAt))}</span>
                <span className="block truncate text-foreground/55">
                    bought{" "}
                    <Link to={bookPath(review.book)} className="text-foreground/75 hover:underline">
                        {review.book.title}
                    </Link>
                </span>
            </span>
        </figcaption>
    </figure>
);

const SellerRow = ({ seller }: { seller: ISellerProfile }) => {
    const place = [displayPlace(seller.city), seller.state?.trim()].filter(Boolean).join(", ");
    return (
        <li>
            <Link to={`/seller/${seller.id}`} className="group flex items-center gap-3">
                <UserAvatar name={seller.userName} photoUrl={seller.profilePictureUrl} className="size-11 text-base" />
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold group-hover:underline">{displayName(seller.userName)}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-sm text-foreground/55">
                        <SellerRating rating={seller.rating} />
                        {!!seller.soldCount && <span>· {seller.soldCount.toLocaleString()} sold</span>}
                    </span>
                    {place && <span className="block truncate text-xs text-foreground/50">{place}</span>}
                </span>
            </Link>
        </li>
    );
};

/** Home "Readers are saying" + "Trusted sellers" (API_CHANGES #24g). Each half hides when empty. */
const SocialProof = ({ tinted }: { tinted?: boolean }) => {
    const { data } = useHomepage((homepage) => ({ reviews: homepage.reviews, sellers: homepage.sellers }));
    const reviews = data?.reviews ?? [];
    const sellers = data?.sellers ?? [];
    if (reviews.length === 0 && sellers.length === 0) return null;
    const both = reviews.length > 0 && sellers.length > 0;

    return (
        <HomeBand tinted={tinted}>
            <div className={cn("grid gap-10", both && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
                {reviews.length > 0 && (
                    <section aria-labelledby="home-reviews">
                        <div className="text-xs font-semibold tracking-[0.14em] text-destructive uppercase">From completed handovers</div>
                        <h2 id="home-reviews" className="mt-2 mb-6 font-serif text-3xl md:text-4xl">
                            Readers are saying
                        </h2>
                        <div className={cn("grid gap-4 sm:grid-cols-2", !both && "lg:grid-cols-3")}>
                            {reviews.map((review, index) => (
                                <ReviewCard key={`${review.book.id}-${index}`} review={review} />
                            ))}
                        </div>
                    </section>
                )}
                {sellers.length > 0 && (
                    <section aria-labelledby="home-sellers" className="self-start rounded-xl border border-border bg-card p-6">
                        <div className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">Trusted sellers</div>
                        <h2 id="home-sellers" className="sr-only">
                            Trusted sellers
                        </h2>
                        <ul className="mt-4 flex flex-col gap-4">
                            {sellers.map((seller) => (
                                <SellerRow key={seller.id} seller={seller} />
                            ))}
                        </ul>
                        <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-foreground/60">
                            Ratings come from completed handovers — no payment protection, so the record matters.
                        </p>
                    </section>
                )}
            </div>
        </HomeBand>
    );
};

export default SocialProof;
