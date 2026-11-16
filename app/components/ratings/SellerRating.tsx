import { Star } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ISellerRating } from "~/types/user";

export const ratingText = (rating?: ISellerRating | null) =>
    rating && rating.count > 0
        ? `Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} ${rating.count === 1 ? "rating" : "ratings"}`
        : "No ratings yet";

/** Compact "★ 4.8 (12)", or "New seller" before the first rating. */
const SellerRating = ({ rating, className }: { rating?: ISellerRating | null; className?: string }) =>
    rating && rating.count > 0 ? (
        <span className={cn("inline-flex items-center gap-1 text-sm", className)} aria-label={ratingText(rating)} role="img">
            <Star className="size-4 fill-primary text-primary" aria-hidden />
            <span className="font-semibold text-foreground">{rating.average.toFixed(1)}</span>
            <span className="text-foreground/55">({rating.count})</span>
        </span>
    ) : (
        <span className={cn("text-sm text-foreground/55", className)}>New seller · no ratings yet</span>
    );

export default SellerRating;
