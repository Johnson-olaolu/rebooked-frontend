import { cn } from "~/lib/utils";

/** 1 … 4 5 6 … 12 around the current page. */
const pageItems = (page: number, total: number): (number | "gap")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const items: (number | "gap")[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    if (start > 2) items.push("gap");
    for (let item = start; item <= end; item += 1) items.push(item);
    if (end < total - 1) items.push("gap");
    items.push(total);
    return items;
};

/** 2a: numbered pages with Previous / Next. `page` is 1-based. */
const Pagination = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;
    const button = "flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm transition-colors";
    return (
        <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                className={cn(button, "hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent")}
            >
                ← Previous
            </button>
            {pageItems(page, totalPages).map((item, index) =>
                item === "gap" ? (
                    <span key={`gap-${index}`} className="px-1 text-foreground/45">
                        …
                    </span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        aria-current={item === page ? "page" : undefined}
                        onClick={() => onChange(item)}
                        className={cn(button, item === page ? "bg-foreground font-semibold text-background" : "hover:bg-secondary")}
                    >
                        {item}
                    </button>
                ),
            )}
            <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
                className={cn(button, "hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent")}
            >
                Next →
            </button>
        </nav>
    );
};

export default Pagination;
