import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import authorService from "~/services/author.service";
import type { IAuthorSummary } from "~/types/author";
import { authorContext } from "~/utils/author";
import { getErrorMessage, getFieldErrors } from "~/utils/https";

const NAME_MAX = 120;

interface ProposeAuthorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** What the seller had typed in the picker. */
    initialName: string;
    /** Authors already on the book, so a "did you mean" match that's already picked says so. */
    selectedIds: string[];
    /** The new author, or the existing one the seller chose instead. */
    onPick: (author: IAuthorSummary) => void;
}

/**
 * "Add a new author" (API_CHANGES #23c). If the catalogue has close matches, the seller picks one or
 * confirms it's someone else. New authors can be used straight away; an admin checks them later.
 * Bottom sheet on phones, centred on desktop, like StartChatDialog.
 */
const ProposeAuthorDialog = ({ open, onOpenChange, initialName, selectedIds, onPick }: ProposeAuthorDialogProps) => {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState<string>();
    const [candidates, setCandidates] = useState<IAuthorSummary[] | null>(null);

    useEffect(() => {
        if (!open) return;
        setName(initialName);
        setError(undefined);
        setCandidates(null);
    }, [open, initialName]);

    const proposeMutation = useMutation({
        mutationFn: ({ force }: { force: boolean }) => authorService.propose(name.trim(), force).then((response) => response.data),
        onSuccess: (result) => {
            if (result?.author) {
                onPick(result.author);
                toast.success(`Added ${result.author.name}. We'll double-check the details.`);
                onOpenChange(false);
            } else if (result?.candidates?.length) {
                setCandidates(result.candidates);
            }
        },
        onError: (err) => {
            const fieldError = getFieldErrors(err).name;
            setCandidates(null);
            if (fieldError) setError(fieldError);
            else toast.error(getErrorMessage(err, "We couldn't add that author. Please try again."));
        },
    });
    const busy = proposeMutation.isPending;
    const trimmed = name.trim();
    const canSubmit = trimmed.length >= 2 && trimmed.length <= NAME_MAX && /\p{L}/u.test(trimmed) && !busy;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // The dialog is portalled, but React still bubbles submit to the book form around the picker.
        event.stopPropagation();
        if (canSubmit) proposeMutation.mutate({ force: false });
    };

    const choose = (author: IAuthorSummary) => {
        onPick(author);
        onOpenChange(false);
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-[0_-12px_40px_rgba(36,27,18,0.2)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95">
                    <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="font-serif text-2xl">
                                {candidates ? "Is it one of these?" : "Add a new author"}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-0.5 text-sm text-foreground/60">
                                {candidates
                                    ? `We already have authors called “${trimmed}”. Pick the right one, or add a new one.`
                                    : "Use the name as it's printed on the cover."}
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close aria-label="Close" className="rounded-md p-1.5 hover:bg-secondary">
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>

                    {candidates ? (
                        <>
                            <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                                {candidates.map((author) => {
                                    const already = selectedIds.includes(author.id);
                                    const context = authorContext(author);
                                    return (
                                        <li key={author.id}>
                                            <button
                                                type="button"
                                                onClick={() => choose(author)}
                                                disabled={already || busy}
                                                className="flex w-full flex-col items-start rounded-lg border border-foreground/12 bg-card px-4 py-3 text-left transition-colors hover:border-foreground/30 disabled:opacity-60"
                                            >
                                                <span className="flex flex-wrap items-center gap-x-2 font-semibold">
                                                    {author.name}
                                                    {!author.verified && (
                                                        <span className="rounded bg-foreground/8 px-1.5 py-px text-[11px] font-medium text-foreground/60">
                                                            Added by a seller
                                                        </span>
                                                    )}
                                                </span>
                                                {context && <span className="mt-0.5 text-sm text-foreground/60">{context}</span>}
                                                {already && <span className="mt-0.5 text-xs text-foreground/55">Already on this book</span>}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="flex flex-col gap-2 border-t border-foreground/10 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row md:pb-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCandidates(null)}
                                    disabled={busy}
                                    className="h-12 rounded-lg font-semibold sm:flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => proposeMutation.mutate({ force: true })}
                                    disabled={busy}
                                    className="h-12 rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-[2]"
                                >
                                    {busy ? "Adding…" : `No, add “${trimmed}”`}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={submit} noValidate>
                            <div className="flex flex-col gap-2 px-5 py-4">
                                <Label htmlFor="new-author-name">Author's name</Label>
                                <Input
                                    id="new-author-name"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setError(undefined);
                                    }}
                                    maxLength={NAME_MAX}
                                    aria-invalid={!!error}
                                    aria-describedby="new-author-hint"
                                    autoFocus
                                    placeholder="Chimamanda Ngozi Adichie"
                                />
                                <p id="new-author-hint" className={cn("text-sm", error ? "text-destructive" : "text-foreground/55")}>
                                    {error ?? "You can use them straight away. We'll check the details later."}
                                </p>
                            </div>
                            <div className="flex gap-3 border-t border-foreground/10 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={busy}
                                    className="h-12 flex-1 rounded-lg font-semibold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="h-12 flex-[2] rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                                >
                                    {busy ? "Checking…" : "Add author"}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default ProposeAuthorDialog;
