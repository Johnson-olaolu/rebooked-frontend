import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useBaseStore } from "~/hooks/store";
import { useSavedIds, useToggleSave } from "~/hooks/useSaved";
import { cn } from "~/lib/utils";
import type { IBook } from "~/types/book";

interface SaveButtonProps {
    book: Pick<IBook, "id" | "title" | "seller">;
    /** `overlay`: round icon on a cover. `inline`: outlined button with a label, for the book page. */
    variant?: "overlay" | "inline";
    className?: string;
    /** Only show it when the book is already saved (sold books can be removed but not newly saved). */
    onlyIfSaved?: boolean;
}

/** The heart. Logged out it goes to log in and comes back; it isn't shown on your own books. */
const SaveButton = ({ book, variant = "overlay", className, onlyIfSaved = false }: SaveButtonProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useBaseStore((state) => (state.accessToken ? state.user : undefined));
    const savedIds = useSavedIds();
    const toggle = useToggleSave();

    if (user && book.seller?.id === user.id) return null;
    const saved = savedIds.has(book.id);
    if (onlyIfSaved && !saved) return null;

    const onClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
            return;
        }
        toggle(book.id, !saved);
    };

    const label = saved ? `Remove ${book.title} from saved` : `Save ${book.title}`;

    if (variant === "inline") {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-pressed={saved}
                aria-label={label}
                className={cn(
                    "inline-flex h-12 items-center gap-2 rounded-lg border px-4 text-[15px] font-semibold transition-colors",
                    saved
                        ? "border-primary/30 bg-primary/8 text-primary"
                        : "border-foreground/15 bg-card text-foreground hover:bg-secondary",
                    className,
                )}
            >
                <Heart className={cn("size-5", saved && "fill-current")} aria-hidden />
                {saved ? "Saved" : "Save"}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={saved}
            aria-label={label}
            title={saved ? "Saved" : "Save"}
            className={cn(
                "flex size-9 items-center justify-center rounded-full bg-background/95 shadow-sm transition-transform outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50",
                saved ? "text-primary" : "text-foreground/70",
                className,
            )}
        >
            <Heart className={cn("size-[18px]", saved && "fill-current")} aria-hidden />
        </button>
    );
};

export default SaveButton;
