import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useRateSeller } from "~/hooks/useRatings";
import type { IPurchaseRating } from "~/types/rating";
import { firstName } from "~/utils/chat";
import { getErrorMessage, getFieldErrors } from "~/utils/https";
import { StarInput } from "./Stars";

export const COMMENT_MAX = 300;

interface RateSellerFormProps {
    bookId: string;
    data: IPurchaseRating;
    onDone?: () => void;
    /** Extra buttons beside Submit (e.g. Cancel in the dialog). */
    secondary?: React.ReactNode;
}

/** Stars plus an optional comment. Creating and editing are the same call. */
const RateSellerForm = ({ bookId, data, onDone, secondary }: RateSellerFormProps) => {
    const [stars, setStars] = useState(data.rating?.stars ?? 0);
    const [comment, setComment] = useState(data.rating?.comment ?? "");
    const [error, setError] = useState("");
    const rate = useRateSeller(bookId);
    const name = firstName(data.seller.userName);
    const editing = !!data.rating;
    const tooLong = comment.length > COMMENT_MAX;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!stars || tooLong) return;
        setError("");
        rate.mutate(
            { stars, comment: comment.trim() || undefined },
            {
                onSuccess: () => {
                    toast.success(editing ? "Rating updated." : "Thanks — your rating helps other buyers.");
                    onDone?.();
                },
                onError: (failure) => {
                    const fields = getFieldErrors(failure);
                    setError(fields.stars ?? fields.comment ?? getErrorMessage(failure, "We couldn't save your rating."));
                },
            },
        );
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
                <p className="mb-1.5 text-sm font-semibold">How was buying from {name}?</p>
                <StarInput value={stars} onChange={setStars} disabled={rate.isPending} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor={`comment-${bookId}`} className="text-sm font-semibold">
                    Anything to add? <span className="font-normal text-foreground/50">(optional)</span>
                </label>
                <textarea
                    id={`comment-${bookId}`}
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    aria-invalid={tooLong}
                    placeholder={`e.g. Book was exactly as described and ${name} was easy to meet.`}
                    className="w-full resize-none rounded-lg border border-foreground/15 bg-card px-3 py-2.5 text-[15px] leading-relaxed outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 aria-invalid:border-destructive"
                />
                <span className={tooLong ? "text-xs text-destructive" : "text-xs text-foreground/50"}>
                    {comment.length}/{COMMENT_MAX} · Shown on {name}'s profile with your display name
                </span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
                {secondary}
                <Button
                    type="submit"
                    disabled={!stars || tooLong || rate.isPending}
                    className="h-12 flex-[2] rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    {rate.isPending ? "Saving…" : editing ? "Update rating" : "Submit rating"}
                </Button>
            </div>
        </form>
    );
};

export default RateSellerForm;
