import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ConfirmDialog from "~/components/ui/confirm-dialog";
import bookService from "~/services/book.service";
import type { BookStatus, IBook } from "~/types/book";
import { editPath } from "~/utils/book";
import { getErrorMessage, getFieldErrors } from "~/utils/https";

type ConfirmKind = "sold" | "remove";

const STATUS_TOAST: Partial<Record<BookStatus, string>> = {
    SOLD: "Marked as sold — it's left the shop.",
    INACTIVE: "Archived — it's hidden from the shop.",
    ACTIVE: "Back on your shelf.",
};

/**
 * Shelf actions shared by the My shelf rows and the edit page: mark as sold, archive,
 * put back on shelf and remove. Render `dialog` once; it holds the confirm prompts.
 */
export const useBookActions = ({ onRemoved }: { onRemoved?: (book: IBook) => void } = {}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Kept separately from `open` so the dialog's text doesn't vanish while it animates closed.
    const [confirm, setConfirm] = useState<{ kind: ConfirmKind; book: IBook }>();
    const [open, setOpen] = useState(false);

    const ask = (kind: ConfirmKind, book: IBook) => {
        setConfirm({ kind, book });
        setOpen(true);
    };

    const refresh = (book: IBook) => {
        queryClient.invalidateQueries({ queryKey: ["shelf"] });
        queryClient.invalidateQueries({ queryKey: ["book", book.id] });
    };

    const statusMutation = useMutation({
        mutationFn: ({ book, status }: { book: IBook; status: BookStatus }) => bookService.setStatus(book.id, status),
        onSuccess: (_response, { book, status }) => {
            refresh(book);
            setOpen(false);
            toast.success(STATUS_TOAST[status] ?? "Saved.");
        },
        onError: (error, { book, status }) => {
            // Going back on the shelf runs the publish checks; send them to fix whatever's missing.
            if (status === "ACTIVE" && Object.keys(getFieldErrors(error)).length > 0) {
                toast.error("This book is missing details it needs to go back on the shelf.", {
                    action: { label: "Edit", onClick: () => navigate(editPath(book)) },
                });
                return;
            }
            toast.error(getErrorMessage(error, "We couldn't update that book. Please try again."));
        },
    });

    const removeMutation = useMutation({
        mutationFn: (book: IBook) => bookService.remove(book.id),
        onSuccess: (_response, book) => {
            // Mark it stale without refetching: a page still showing it is about to leave, and a
            // later visit should fetch (and 404) rather than show the cached copy.
            queryClient.invalidateQueries({ queryKey: ["book", book.id], refetchType: "none" });
            queryClient.invalidateQueries({ queryKey: ["shelf"] });
            setOpen(false);
            toast.success(`Removed “${book.title}” from your shelf.`);
            onRemoved?.(book);
        },
        onError: (error) => toast.error(getErrorMessage(error, "We couldn't remove that book. Please try again.")),
    });

    const title = confirm?.book.title ?? "this book";
    const dialog = (
        <>
            <ConfirmDialog
                open={open && confirm?.kind === "sold"}
                onOpenChange={setOpen}
                title="Mark this book as sold?"
                description={
                    <>
                        <strong className="font-semibold text-foreground">{title}</strong> leaves the shop straight away. It
                        stays on your profile as a completed sale.
                        <span className="mt-2 block text-sm">
                            Sold to someone you chatted with? Mark it sold from your chat with them instead, so it shows as
                            sold to them.
                        </span>
                    </>
                }
                confirmLabel="Yes, it's sold"
                pendingLabel="Saving…"
                cancelLabel="Keep it on my shelf"
                tone="olive"
                pending={statusMutation.isPending}
                onConfirm={() => confirm && statusMutation.mutate({ book: confirm.book, status: "SOLD" })}
            />
            <ConfirmDialog
                open={open && confirm?.kind === "remove"}
                onOpenChange={setOpen}
                title={`Remove “${title}” from your shelf?`}
                description="This deletes it for good and can't be undone. To just hide it from the shop, archive it instead."
                confirmLabel="Remove"
                pendingLabel="Removing…"
                tone="destructive"
                pending={removeMutation.isPending}
                onConfirm={() => confirm && removeMutation.mutate(confirm.book)}
            />
        </>
    );

    return {
        markSold: (book: IBook) => ask("sold", book),
        archive: (book: IBook) => statusMutation.mutate({ book, status: "INACTIVE" }),
        restore: (book: IBook) => statusMutation.mutate({ book, status: "ACTIVE" }),
        remove: (book: IBook) => ask("remove", book),
        busy: statusMutation.isPending || removeMutation.isPending,
        dialog,
    };
};
