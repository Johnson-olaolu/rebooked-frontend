import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "~/components/ui/button";
import { usePurchaseRating } from "~/hooks/useRatings";
import { firstName } from "~/utils/chat";
import RateSellerForm from "./RateSellerForm";

interface RateSellerDialogProps {
    bookId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Rate the seller of a book you bought: bottom sheet on phones, centred on desktop (like StartChatDialog). */
const RateSellerDialog = ({ bookId, open, onOpenChange }: RateSellerDialogProps) => {
    const query = usePurchaseRating(bookId, open);
    const data = query.data;

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-2xl bg-background shadow-[0_-12px_40px_rgba(36,27,18,0.2)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95">
                    <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                            {data?.book.coverUrl && <img src={data.book.coverUrl} alt="" className="h-14 w-10 shrink-0 rounded-sm object-cover" />}
                            <div className="min-w-0">
                                <DialogPrimitive.Title className="font-serif text-2xl">
                                    {data ? `Rate ${firstName(data.seller.userName)}` : "Rate the seller"}
                                </DialogPrimitive.Title>
                                <DialogPrimitive.Description className="mt-0.5 truncate text-sm text-foreground/60">
                                    {data ? (
                                        <>
                                            You bought <em className="font-serif">{data.book.title}</em>
                                        </>
                                    ) : (
                                        "One moment…"
                                    )}
                                </DialogPrimitive.Description>
                            </div>
                        </div>
                        <DialogPrimitive.Close aria-label="Close" className="rounded-md p-1.5 hover:bg-secondary">
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>
                    <div className="px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                        {query.isError ? (
                            <p className="py-6 text-center text-foreground/60">We couldn't load this. Try again in a moment.</p>
                        ) : !data ? (
                            <div aria-busy className="h-48 animate-pulse rounded-lg bg-secondary" />
                        ) : data.canRate ? (
                            <RateSellerForm
                                key={data.rating?.updatedAt ?? "new"}
                                bookId={bookId}
                                data={data}
                                onDone={() => onOpenChange(false)}
                                secondary={
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 flex-1 rounded-lg font-semibold">
                                        Later
                                    </Button>
                                }
                            />
                        ) : (
                            <p className="py-6 text-center text-foreground/60">Only the person who bought this book can rate the seller.</p>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default RateSellerDialog;
