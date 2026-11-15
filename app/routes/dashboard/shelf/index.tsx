import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import type { BookStatus, IBook } from "~/types/book";
import { SHELF_TABS, conditionLabel } from "~/utils/book";
import { formatNaira } from "~/utils/money";
import { timeAgo } from "~/utils/time";
import EmptyState from "../components/EmptyState";

const primaryButton =
    "h-11 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

const STATUS_PILL: Record<BookStatus, string> = {
    ACTIVE: "bg-olive/15 text-olive",
    DRAFT: "bg-foreground/10 text-foreground/70",
    SOLD: "bg-primary/12 text-primary",
    INACTIVE: "bg-foreground/8 text-foreground/55",
};

const TAB_EMPTY: Record<BookStatus, { title: string; description: string }> = {
    ACTIVE: { title: "Nothing available right now", description: "Books you add to your shelf show up here and in the shop." },
    DRAFT: { title: "No drafts", description: "Save a book as a draft to finish it later. Drafts never appear in the shop." },
    SOLD: { title: "Nothing sold yet", description: "Sold books stay on your profile as a trust signal but leave the shop." },
    INACTIVE: { title: "Nothing archived", description: "Archived books are hidden from the shop until you put them back." },
};

const isStatus = (value: string | null): value is BookStatus => SHELF_TABS.some((tab) => tab.status === value);

const editSoon = () => toast("Editing books is coming soon.");

const ShelfRow = ({ book }: { book: IBook }) => {
    const tab = SHELF_TABS.find((item) => item.status === book.status);
    const meta = [book.author, conditionLabel(book.condition), `added ${timeAgo(book.createdAt)}`].filter(Boolean).join(" · ");
    return (
        <li className="flex items-center gap-4 p-4">
            <div className="h-20 w-15 shrink-0 overflow-hidden rounded bg-secondary">
                {book.coverImage?.url ? (
                    <img src={book.coverImage.url} alt="" className="size-full object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <img src="/brand/rebooked-mark-ink.png" alt="" className="h-6 w-auto opacity-25" />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-lg">{book.title}</div>
                <div className="truncate text-sm text-foreground/55">{meta}</div>
                <div className="mt-1.5 flex items-center gap-2.5 md:hidden">
                    <span className="font-semibold">{formatNaira(book.price, book.isFree) || "—"}</span>
                </div>
            </div>
            <span className={cn("hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline", STATUS_PILL[book.status])}>
                {tab?.label ?? book.status}
            </span>
            <span className="hidden w-24 text-right font-semibold md:block">{formatNaira(book.price, book.isFree) || "—"}</span>
            <button type="button" onClick={editSoon} className="shrink-0 text-sm font-semibold text-primary hover:underline">
                {book.status === "DRAFT" ? "Continue" : "Edit"}
            </button>
        </li>
    );
};

const ShelfPage = () => {
    const [params, setParams] = useSearchParams();
    const statusParam = params.get("status");
    const status: BookStatus = isStatus(statusParam) ? statusParam : "ACTIVE";

    const shelfQuery = useQuery({
        queryKey: ["shelf", status],
        queryFn: () => bookService.getMyShelf({ status }),
        select: (response) => response.data,
        retry: 1,
    });
    const counts = shelfQuery.data?.counts;
    const total = counts ? Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0) : undefined;
    const books = shelfQuery.data?.content ?? [];

    const addButton = (
        <Button asChild className={primaryButton}>
            <Link to="/dashboard/shelf/new">+ Add to shelf</Link>
        </Button>
    );

    return (
        <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl">My shelf</h1>
                    {total !== undefined && total > 0 && (
                        <p className="mt-1.5 text-foreground/60">
                            {total} {total === 1 ? "book" : "books"} · {counts?.ACTIVE ?? 0} available
                        </p>
                    )}
                </div>
                {total !== 0 && addButton}
            </div>

            {shelfQuery.isError ? (
                <EmptyState
                    title="We couldn't load your shelf"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => shelfQuery.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : total === 0 ? (
                <EmptyState
                    title="Your shelf is empty"
                    description="Add the first book you're done with. It takes about ninety seconds — add a photo, a price and buyers message you directly."
                    action={
                        <Button asChild className={primaryButton}>
                            <Link to="/dashboard/shelf/new">+ Add your first book</Link>
                        </Button>
                    }
                />
            ) : (
                <>
                    <nav aria-label="Shelf status" className="mb-5 flex gap-2 overflow-x-auto pb-1">
                        {SHELF_TABS.map((tab) => {
                            const selected = tab.status === status;
                            return (
                                <button
                                    key={tab.status}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setParams(tab.status === "ACTIVE" ? {} : { status: tab.status }, { replace: true })}
                                    className={cn(
                                        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                                        selected
                                            ? "border-foreground bg-foreground font-semibold text-background"
                                            : "border-foreground/15 text-foreground/70 hover:border-foreground/40",
                                    )}
                                >
                                    {tab.label}
                                    {counts && ` · ${counts[tab.status] ?? 0}`}
                                </button>
                            );
                        })}
                    </nav>

                    {shelfQuery.isLoading ? (
                        <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/10 bg-card" aria-busy>
                            {[0, 1, 2].map((index) => (
                                <li key={index} className="flex items-center gap-4 p-4">
                                    <div className="h-20 w-15 animate-pulse rounded bg-secondary" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
                                        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : books.length === 0 ? (
                        <EmptyState title={TAB_EMPTY[status].title} description={TAB_EMPTY[status].description} />
                    ) : (
                        <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/10 bg-card">
                            {books.map((book) => (
                                <ShelfRow key={book.id} book={book} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};

export default ShelfPage;
