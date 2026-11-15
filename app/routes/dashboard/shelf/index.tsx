import { useQuery } from "@tanstack/react-query";
import { Archive, BadgeCheck, Eye, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useBookActions } from "~/hooks/useBookActions";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import type { BookStatus, IBook } from "~/types/book";
import { SHELF_TABS, STATUS_LABEL, STATUS_PILL, bookPath, conditionLabel, editPath } from "~/utils/book";
import { formatNaira } from "~/utils/money";
import { timeAgo } from "~/utils/time";
import EmptyState from "../components/EmptyState";

const primaryButton =
    "h-11 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

const TAB_EMPTY: Record<BookStatus, { title: string; description: string }> = {
    ACTIVE: { title: "Nothing available right now", description: "Books you add to your shelf show up here and in the shop." },
    DRAFT: { title: "No drafts", description: "Save a book as a draft to finish it later. Drafts never appear in the shop." },
    SOLD: { title: "Nothing sold yet", description: "Sold books stay on your profile as a trust signal but leave the shop." },
    INACTIVE: { title: "Nothing archived", description: "Archived books are hidden from the shop until you put them back." },
};

const isStatus = (value: string | null): value is BookStatus => SHELF_TABS.some((tab) => tab.status === value);

type ShelfActions = ReturnType<typeof useBookActions>;

/** Sold books can't be edited, so they open their public page instead. */
const ROW_LINK: Record<BookStatus, { label: string; to: (book: IBook) => string }> = {
    ACTIVE: { label: "Edit", to: editPath },
    INACTIVE: { label: "Edit", to: editPath },
    DRAFT: { label: "Continue", to: editPath },
    SOLD: { label: "View", to: bookPath },
};

const ShelfRow = ({ book, actions }: { book: IBook; actions: ShelfActions }) => {
    const meta = [book.author, conditionLabel(book.condition), `added ${timeAgo(book.createdAt)}`].filter(Boolean).join(" · ");
    const link = ROW_LINK[book.status];
    return (
        <li className="relative flex items-center gap-4 p-4">
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
                {/* Stretched link: the whole row opens the book; the menu sits above it. */}
                <Link to={link.to(book)} className="block truncate font-serif text-lg after:absolute after:inset-0 hover:underline">
                    {book.title}
                </Link>
                <div className="truncate text-sm text-foreground/55">{meta}</div>
                <div className="mt-1.5 flex items-center gap-2.5 md:hidden">
                    <span className="font-semibold">{formatNaira(book.price, book.isFree) || "—"}</span>
                </div>
            </div>
            <span className={cn("hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline", STATUS_PILL[book.status])}>
                {STATUS_LABEL[book.status]}
            </span>
            <span className="hidden w-24 text-right font-semibold md:block">{formatNaira(book.price, book.isFree) || "—"}</span>
            <span aria-hidden className="hidden shrink-0 text-sm font-semibold text-primary sm:inline">
                {link.label}
            </span>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                    disabled={actions.busy}
                    aria-label={`More actions for ${book.title}`}
                    className="relative z-[1] -mr-1.5 shrink-0 rounded-md p-1.5 text-foreground/60 outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    <MoreHorizontal className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                    {book.status !== "DRAFT" && (
                        <DropdownMenuItem asChild>
                            <Link to={bookPath(book)}>
                                <Eye /> View book page
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {book.status !== "SOLD" && (
                        <DropdownMenuItem asChild>
                            <Link to={editPath(book)}>
                                <Pencil /> {book.status === "DRAFT" ? "Continue editing" : "Edit"}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {book.status === "ACTIVE" && (
                        <>
                            <DropdownMenuItem onSelect={() => actions.markSold(book)}>
                                <BadgeCheck /> Mark as sold
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => actions.archive(book)}>
                                <Archive /> Archive
                            </DropdownMenuItem>
                        </>
                    )}
                    {(book.status === "INACTIVE" || book.status === "SOLD") && (
                        <DropdownMenuItem onSelect={() => actions.restore(book)}>
                            <RotateCcw /> Put back on shelf
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => actions.remove(book)}>
                        <Trash2 /> Remove from shelf
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
    const actions = useBookActions();

    const addButton = (
        <Button asChild className={primaryButton}>
            <Link to="/dashboard/shelf/new">+ Add to shelf</Link>
        </Button>
    );

    return (
        <>
            {actions.dialog}
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
                                <ShelfRow key={book.id} book={book} actions={actions} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </>
    );
};

export default ShelfPage;
