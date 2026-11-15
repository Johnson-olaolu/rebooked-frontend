import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import BookForm, { bookToFormState, type BookFormAction } from "~/components/shelf/BookForm";
import { Button } from "~/components/ui/button";
import { useBaseStore } from "~/hooks/store";
import { useBookActions } from "~/hooks/useBookActions";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import type { BookStatus, IBook, IUpdateBookPayload } from "~/types/book";
import { STATUS_LABEL, STATUS_PILL, bookPath } from "~/utils/book";
import { getErrorStatus } from "~/utils/https";
import { timeAgo } from "~/utils/time";
import EmptyState from "../../components/EmptyState";

const shelfTabPath = (status: BookStatus) => (status === "ACTIVE" ? "/dashboard/shelf" : `/dashboard/shelf?status=${status}`);

const outlineButton = "h-10 rounded-md px-3.5 font-semibold";

const BackLink = () => (
    <Link to="/dashboard/shelf" className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        My shelf
    </Link>
);

const meta = (book: IBook) => {
    const parts = [`Added ${timeAgo(book.createdAt)}`];
    if (book.status !== "DRAFT") parts.push(`${book.viewCount ?? 0} ${book.viewCount === 1 ? "view" : "views"}`);
    const edited = new Date(book.updatedAt).getTime() - new Date(book.createdAt).getTime() > 60_000;
    if (edited) parts.push(`last edited ${timeAgo(book.updatedAt)}`);
    return parts.join(" · ");
};

/** 3d: edit a book on your shelf (or finish a draft), plus its status actions. */
const EditBookPage = () => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const userId = useBaseStore((state) => state.user?.id);

    const bookQuery = useQuery({
        queryKey: ["book", id],
        queryFn: () => bookService.get(id),
        select: (response) => response.data,
        retry: (count, error) => getErrorStatus(error) !== 404 && count < 1,
    });
    const book = bookQuery.data;
    const actions = useBookActions({ onRemoved: () => navigate("/dashboard/shelf", { replace: true }) });

    // Only rebuild the form's starting point when a different book loads.
    const initial = useMemo(() => (book ? bookToFormState(book) : undefined), [book?.id]);

    if (bookQuery.isLoading) {
        return (
            <div aria-busy className="flex flex-col gap-6">
                <div className="h-9 w-2/3 animate-pulse rounded bg-secondary" />
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="h-96 animate-pulse rounded-lg bg-secondary" />
                    <div className="h-64 animate-pulse rounded-lg bg-secondary" />
                </div>
            </div>
        );
    }

    // Someone else's book, a deleted one, or a bad link: same answer.
    if (!book || (book.seller?.id && userId && book.seller.id !== userId)) {
        return (
            <>
                <BackLink />
                <EmptyState
                    title="We couldn't find that book"
                    description={
                        bookQuery.isError && getErrorStatus(bookQuery.error) !== 404
                            ? "Check your connection and try again."
                            : "It may have been removed from your shelf."
                    }
                    action={
                        <Button asChild variant="outline" className="h-11 rounded-md px-5 font-semibold">
                            <Link to="/dashboard/shelf">Back to my shelf</Link>
                        </Button>
                    }
                />
            </>
        );
    }

    const done = async (message: string, status: BookStatus) => {
        queryClient.invalidateQueries({ queryKey: ["shelf"] });
        queryClient.invalidateQueries({ queryKey: ["book", id] });
        toast.success(message);
        navigate(shelfTabPath(status), { replace: true });
    };

    const save = async (payload: IUpdateBookPayload) => {
        await bookService.update(id, payload);
        await done(book.status === "DRAFT" ? "Draft saved." : "Changes saved.", book.status);
    };

    const publish = async (payload: IUpdateBookPayload) => {
        await bookService.update(id, payload);
        await bookService.setStatus(id, "ACTIVE");
        await done("Added to your shelf.", "ACTIVE");
    };

    const formActions: BookFormAction[] =
        book.status === "DRAFT"
            ? [
                  { key: "draft", label: "Save draft", busyLabel: "Saving…", rules: "DRAFT", requiresChange: true, onSave: save },
                  { key: "publish", label: "Add to shelf", busyLabel: "Adding…", rules: "ACTIVE", primary: true, onSave: publish },
              ]
            : [
                  {
                      key: "save",
                      label: "Save changes",
                      busyLabel: "Saving…",
                      rules: "ACTIVE",
                      primary: true,
                      requiresChange: true,
                      onSave: save,
                  },
              ];

    const header = (
        <div>
            <BackLink />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-serif text-3xl break-words md:text-4xl">{book.title}</h1>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_PILL[book.status])}>
                            {STATUS_LABEL[book.status]}
                        </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/60">{meta(book)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {book.status !== "DRAFT" && (
                        <Button asChild variant="outline" className={outlineButton}>
                            <Link to={bookPath(book)}>View book page</Link>
                        </Button>
                    )}
                    {book.status === "ACTIVE" && (
                        <>
                            <Button
                                type="button"
                                disabled={actions.busy}
                                onClick={() => actions.markSold(book)}
                                className={cn(outlineButton, "bg-olive text-white hover:bg-olive/90")}
                            >
                                Mark as sold
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={actions.busy}
                                onClick={() => actions.archive(book)}
                                className={outlineButton}
                            >
                                Archive
                            </Button>
                        </>
                    )}
                    {(book.status === "INACTIVE" || book.status === "SOLD") && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={actions.busy}
                            onClick={() => actions.restore(book)}
                            className={outlineButton}
                        >
                            Put back on shelf
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        disabled={actions.busy}
                        onClick={() => actions.remove(book)}
                        className={cn(outlineButton, "border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive")}
                    >
                        Remove
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {actions.dialog}
            <BookForm
                key={book.id}
                initial={initial}
                header={header}
                actions={formActions}
                cancelTo={shelfTabPath(book.status)}
                discardMessage="Discard your changes?"
                readOnly={book.status === "SOLD"}
                readOnlyNote="Sold books can't be edited. Put it back on your shelf first if the sale fell through."
            />
        </>
    );
};

export default EditBookPage;
