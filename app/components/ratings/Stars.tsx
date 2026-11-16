import { Star } from "lucide-react";
import { useId } from "react";
import { cn } from "~/lib/utils";

export const STAR_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"] as const;

/** Read-only stars, filled to the exact value (4.5 shows four and a half). The text beside it carries the number. */
export const StarsDisplay = ({ value, className, size = "size-4" }: { value: number; className?: string; size?: string }) => (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
            const fill = Math.max(0, Math.min(1, value - index));
            return (
                <span key={index} className="relative inline-flex">
                    <Star className={cn(size, "text-foreground/25")} />
                    {fill > 0 && (
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                            <Star className={cn(size, "fill-primary text-primary")} />
                        </span>
                    )}
                </span>
            );
        })}
    </span>
);

/**
 * 1–5 star picker. Real radio buttons underneath, so arrow keys and screen readers work as for any
 * radio group; the stars are their labels.
 */
export const StarInput = ({ value, onChange, disabled }: { value: number; onChange: (stars: number) => void; disabled?: boolean }) => {
    const name = useId();
    return (
        <fieldset disabled={disabled}>
            <legend className="sr-only">Your rating</legend>
            <div className="flex items-center gap-1">
                {STAR_LABELS.map((label, index) => {
                    const stars = index + 1;
                    const id = `${name}-${stars}`;
                    return (
                        <span key={stars}>
                            <input
                                id={id}
                                type="radio"
                                name={name}
                                value={stars}
                                checked={value === stars}
                                onChange={() => onChange(stars)}
                                className="peer sr-only"
                            />
                            <label
                                htmlFor={id}
                                title={label}
                                className="block cursor-pointer rounded-md p-1 transition-transform peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:scale-110"
                            >
                                <Star className={cn("size-9", stars <= value ? "fill-primary text-primary" : "text-foreground/25")} aria-hidden />
                                <span className="sr-only">
                                    {stars} {stars === 1 ? "star" : "stars"}: {label}
                                </span>
                            </label>
                        </span>
                    );
                })}
                <span className="ml-2 text-sm font-semibold text-foreground/70" aria-hidden>
                    {value ? STAR_LABELS[value - 1] : ""}
                </span>
            </div>
        </fieldset>
    );
};
