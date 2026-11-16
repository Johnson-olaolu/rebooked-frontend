import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import UserAvatar from "~/components/UserAvatar";
import { useChatBuyers } from "~/hooks/useRatings";
import { cn } from "~/lib/utils";
import type { IBook } from "~/types/book";
import type { IChatBuyer } from "~/types/rating";
import { firstName, relativeTime } from "~/utils/chat";
import { displayName } from "~/utils/text";

interface MarkSoldDialogProps {
    book?: IBook;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pending: boolean;
    onConfirm: (buyer: IChatBuyer) => void;
    /** Offered when nobody has chatted about the book, so it can't be marked as sold. */
    onArchive?: () => void;
}

const lastMessage = (iso?: string | null) => {
    if (!iso) return "";
    const ago = relativeTime(iso);
    return ago === "Now" ? "Last message just now" : `Last message ${ago} ago`;
};

const cancelClass =
    "h-11 rounded-md border border-foreground/15 px-4 font-semibold transition-colors hover:bg-secondary disabled:opacity-50";
const actionClass =
    "h-11 rounded-md px-5 font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] transition-colors disabled:opacity-60";

/**
 * "Mark as sold" always names the buyer, picked from the people who chatted about the book
 * (API_CHANGES #22a). It keeps sales on Rebooked honest and tells us who to ask for a rating.
 */
const MarkSoldDialog = ({ book, open, onOpenChange, pending, onConfirm, onArchive }: MarkSoldDialogProps) => {
    const buyersQuery = useChatBuyers(book?.id, open);
    const buyers = buyersQuery.data ?? [];
    const [choice, setChoice] = useState("");

    // Fresh choice each time; with only one person to choose from, choose them.
    useEffect(() => {
        if (open) setChoice(buyers.length === 1 ? buyers[0].userId : "");
    }, [open, book?.id, buyers.length]);

    const picked = buyers.find((buyer) => buyer.userId === choice);
    const loading = buyersQuery.isLoading;
    const noChats = !loading && !buyersQuery.isError && buyers.length === 0;
    const title = book?.title ?? "This book";

    return (
        <AlertDialogPrimitive.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
            <AlertDialogPrimitive.Portal>
                <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-foreground/10 bg-card shadow-[0_24px_60px_rgba(36,27,18,0.25)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                    <div className="px-6 pt-6">
                        <AlertDialogPrimitive.Title className="font-serif text-2xl">
                            {noChats ? "Who did you sell it to?" : "Mark this book as sold?"}
                        </AlertDialogPrimitive.Title>
                        <AlertDialogPrimitive.Description className="mt-2 text-[15px] text-foreground/70">
                            {noChats ? (
                                <>
                                    You can only mark a book as sold to someone you've chatted with about it on Rebooked, and nobody
                                    has messaged you about <strong className="font-semibold text-foreground">{title}</strong> yet.
                                </>
                            ) : (
                                <>
                                    <strong className="font-semibold text-foreground">{title}</strong> leaves the shop straight away.
                                </>
                            )}
                        </AlertDialogPrimitive.Description>
                    </div>

                    <div className="min-h-0 overflow-y-auto px-6">
                        {loading ? (
                            <div aria-busy className="mt-5 space-y-2">
                                <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                                <div className="h-14 animate-pulse rounded-lg bg-secondary" />
                                <div className="h-14 animate-pulse rounded-lg bg-secondary" />
                            </div>
                        ) : buyersQuery.isError ? (
                            <p className="mt-5 text-sm text-foreground/70">
                                We couldn't load the people you chatted with.{" "}
                                <button type="button" onClick={() => buyersQuery.refetch()} className="font-semibold text-primary hover:underline">
                                    Try again
                                </button>
                            </p>
                        ) : noChats ? (
                            <p className="mt-3 text-sm text-foreground/60">
                                Sold it some other way? Archive it to take it out of the shop. You can put it back any time.
                            </p>
                        ) : (
                            <fieldset className="mt-5">
                                <legend className="mb-2 text-sm font-semibold">Who bought it?</legend>
                                <div className="flex flex-col gap-2">
                                    {buyers.map((buyer) => (
                                        <label
                                            key={buyer.userId}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                                                choice === buyer.userId ? "border-primary/50 bg-primary/5" : "border-foreground/12 hover:bg-secondary/60",
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="buyer"
                                                value={buyer.userId}
                                                checked={choice === buyer.userId}
                                                onChange={() => setChoice(buyer.userId)}
                                                disabled={pending}
                                                className="size-4 accent-[var(--color-primary)]"
                                            />
                                            <UserAvatar name={buyer.userName} photoUrl={buyer.profilePictureUrl} className="size-9 text-sm" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-semibold">{displayName(buyer.userName)}</span>
                                                {buyer.lastMessageAt && (
                                                    <span className="block text-xs text-foreground/55">{lastMessage(buyer.lastMessageAt)}</span>
                                                )}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <p className="mt-3 text-sm text-foreground/60" aria-live="polite">
                                    {picked
                                        ? `We'll let ${firstName(picked.userName)} know and ask them to rate you.`
                                        : "Choose who bought it. Only people who messaged you about this book are listed."}
                                </p>
                            </fieldset>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-2.5 px-6 pb-6 sm:flex-row sm:justify-end">
                        <AlertDialogPrimitive.Cancel disabled={pending} className={cancelClass}>
                            {noChats ? "Cancel" : "Keep it on my shelf"}
                        </AlertDialogPrimitive.Cancel>
                        {noChats ? (
                            onArchive && (
                                <AlertDialogPrimitive.Action
                                    disabled={pending}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        onArchive();
                                    }}
                                    className={cn(actionClass, "bg-primary text-primary-foreground hover:bg-primary/90")}
                                >
                                    {pending ? "Archiving…" : "Archive instead"}
                                </AlertDialogPrimitive.Action>
                            )
                        ) : (
                            <AlertDialogPrimitive.Action
                                disabled={pending || !picked}
                                onClick={(event) => {
                                    event.preventDefault();
                                    if (picked) onConfirm(picked);
                                }}
                                className={cn(actionClass, "bg-olive text-white hover:bg-olive/90")}
                            >
                                {pending ? "Saving…" : picked ? `Sold to ${firstName(picked.userName)}` : "Mark as sold"}
                            </AlertDialogPrimitive.Action>
                        )}
                    </div>
                </AlertDialogPrimitive.Content>
            </AlertDialogPrimitive.Portal>
        </AlertDialogPrimitive.Root>
    );
};

export default MarkSoldDialog;
