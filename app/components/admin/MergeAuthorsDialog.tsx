import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import AuthorProfileCard from "~/components/admin/AuthorProfileCard";
import AuthorSearchSelect from "~/components/admin/AuthorSearchSelect";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useInvalidateAuthors } from "~/hooks/useAdminAuthors";
import adminAuthorService from "~/services/admin-author.service";
import type { IAdminAuthor } from "~/types/author";
import { getErrorMessage, getFieldErrors } from "~/utils/https";

interface AuthorRef {
    id: string;
    name: string;
}

interface MergeAuthorsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The duplicate: it's retired and points at the one kept. */
    from: AuthorRef;
    /** The author to keep. Leave out to search for it in the dialog. */
    into?: AuthorRef | null;
    onMerged?: (survivor: IAdminAuthor) => void;
}

const REASON_MAX = 500;

/**
 * The audited merge (API_CHANGES #23f): pick the author to keep, check both profiles and the books
 * that list both, give a reason, confirm. Books, other names and catalogue links move over; the
 * duplicate's old links keep working.
 */
const MergeAuthorsDialog = ({ open, onOpenChange, from, into = null, onMerged }: MergeAuthorsDialogProps) => {
    const navigate = useNavigate();
    const invalidate = useInvalidateAuthors();
    const [target, setTarget] = useState<AuthorRef | null>(into);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState<string>();

    useEffect(() => {
        if (!open) return;
        setTarget(into);
        setReason("");
        setReasonError(undefined);
        // Only reset when the dialog opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const previewQuery = useQuery({
        queryKey: ["merge-preview", from.id, target?.id],
        queryFn: () => adminAuthorService.mergePreview(from.id, target!.id),
        select: (response) => response.data,
        enabled: open && !!target,
    });
    const preview = previewQuery.data;

    const mergeMutation = useMutation({
        mutationFn: () => adminAuthorService.merge(from.id, target!.id, reason.trim()).then((response) => response.data),
        onSuccess: (survivor) => {
            void invalidate();
            toast.success(`Merged ${from.name} into ${survivor.name}`, {
                action: { label: "Open", onClick: () => navigate(`/admin/authors/${survivor.id}`) },
            });
            onOpenChange(false);
            onMerged?.(survivor);
        },
        onError: (error) => {
            const fieldError = getFieldErrors(error).reason;
            if (fieldError) setReasonError(fieldError);
            else toast.error(getErrorMessage(error, "The merge didn't go through. Nothing was changed."));
        },
    });
    const busy = mergeMutation.isPending;
    const canMerge = !!target && !!preview && reason.trim().length > 0 && reason.length <= REASON_MAX && !busy;
    const shared = preview?.sharedBooks ?? [];

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-[0_-12px_40px_rgba(36,27,18,0.2)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95">
                    <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="font-serif text-2xl break-words">Merge {from.name}</DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-0.5 text-sm text-foreground/60">
                                Its books, other names and catalogue links move to the author you keep. It stops appearing in
                                search, and its old links lead to the author you keep.
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close aria-label="Close" className="rounded-md p-1.5 hover:bg-secondary">
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                        {!target ? (
                            <AuthorSearchSelect
                                label="Which author should we keep?"
                                excludeIds={[from.id]}
                                onSelect={(author) => setTarget({ id: author.id, name: author.name })}
                            />
                        ) : previewQuery.isLoading ? (
                            <div aria-busy className="grid gap-3 md:grid-cols-2">
                                <div className="h-36 animate-pulse rounded-lg bg-secondary" />
                                <div className="h-36 animate-pulse rounded-lg bg-secondary" />
                            </div>
                        ) : previewQuery.isError || !preview ? (
                            <p className="text-sm text-destructive">
                                {getErrorMessage(previewQuery.error, "We couldn't load these two authors.")}{" "}
                                <button type="button" onClick={() => setTarget(null)} className="font-semibold underline">
                                    Pick another
                                </button>
                            </p>
                        ) : (
                            <>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <AuthorProfileCard author={preview.from} label="Merge away" />
                                    <AuthorProfileCard author={preview.into} label="Keep" className="border-olive/40" />
                                </div>
                                {!into && (
                                    <button type="button" onClick={() => setTarget(null)} className="text-sm font-semibold text-primary hover:underline">
                                        Keep a different author
                                    </button>
                                )}
                                {shared.length > 0 && (
                                    <div className="rounded-lg border border-foreground/10 bg-secondary px-4 py-3 text-sm">
                                        <p className="font-semibold">
                                            {shared.length} {shared.length === 1 ? "book lists" : "books list"} both. The duplicate entry is removed
                                            from {shared.length === 1 ? "it" : "them"}:
                                        </p>
                                        <p className="mt-1 text-foreground/70">{shared.map((book) => book.title).join(", ")}</p>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="merge-reason">Why are these the same person?</Label>
                                    <textarea
                                        id="merge-reason"
                                        rows={3}
                                        value={reason}
                                        onChange={(event) => {
                                            setReason(event.target.value);
                                            setReasonError(undefined);
                                        }}
                                        maxLength={REASON_MAX}
                                        aria-invalid={!!reasonError}
                                        aria-describedby="merge-reason-hint"
                                        placeholder="Same Open Library record; seller misspelled the surname."
                                        className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
                                    />
                                    <p id="merge-reason-hint" className={reasonError ? "text-sm text-destructive" : "text-sm text-foreground/55"}>
                                        {reasonError ?? "Saved in the audit trail with your name."}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-3 border-t border-foreground/10 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="h-12 flex-1 rounded-lg font-semibold">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => mergeMutation.mutate()}
                            disabled={!canMerge}
                            className="h-12 flex-[2] rounded-lg bg-destructive font-semibold text-white hover:bg-destructive/90"
                        >
                            {busy ? "Merging…" : target ? `Merge into ${target.name}` : "Merge"}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default MergeAuthorsDialog;
