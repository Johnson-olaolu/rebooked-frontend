import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useChatActions } from "~/hooks/useChat";
import { ChatError } from "~/lib/chatSocket";
import type { IBook } from "~/types/book";
import { MESSAGE_MAX, MONEY_NOTE, firstName, threadPath } from "~/utils/chat";
import { displayName } from "~/utils/text";

const OPENER = "Hi! Is this still available?";

const START_ERRORS: Partial<Record<string, string>> = {
    OWN_BOOK: "That's your own book.",
    BOOK_NOT_AVAILABLE: "This book isn't available any more.",
    TIMEOUT: "Couldn't reach Rebooked. Check your connection and try again.",
};

interface StartChatDialogProps {
    book: IBook;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * First message about a book (bottom sheet on mobile, centred on desktop). Sending finds or creates
 * the conversation with this seller and attaches the book, then opens the thread.
 */
const StartChatDialog = ({ book, open, onOpenChange }: StartChatDialogProps) => {
    const navigate = useNavigate();
    const { startConversation } = useChatActions();
    const [body, setBody] = useState(OPENER);
    const [sending, setSending] = useState(false);
    const sellerName = displayName(book.seller?.userName) || "the seller";

    useEffect(() => {
        if (open) setBody(OPENER);
    }, [open]);

    const trimmed = body.trim();
    const canSend = trimmed.length > 0 && body.length <= MESSAGE_MAX && !sending;

    const send = async () => {
        if (!canSend) return;
        setSending(true);
        try {
            const conversation = await startConversation(book.id, trimmed);
            onOpenChange(false);
            navigate(threadPath(conversation.id, book.id));
        } catch (error) {
            const code = error instanceof ChatError ? error.code : "";
            toast.error(START_ERRORS[code] ?? (error instanceof ChatError ? error.message : "Couldn't send. Try again."));
        } finally {
            setSending(false);
        }
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-[0_-12px_40px_rgba(36,27,18,0.2)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-95">
                    <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="font-serif text-2xl">Message {firstName(sellerName)}</DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-0.5 truncate text-sm text-foreground/60">
                                About <em className="font-serif">{book.title}</em>
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close aria-label="Close" className="rounded-md p-1.5 hover:bg-secondary">
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>
                    <div className="space-y-3 px-5 py-4">
                        <textarea
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void send();
                            }}
                            rows={4}
                            aria-label="Your message"
                            autoFocus
                            className="w-full resize-none rounded-lg border border-foreground/15 bg-card px-3 py-2.5 text-[15px] leading-relaxed outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15"
                        />
                        {body.length > MESSAGE_MAX && (
                            <p className="text-xs text-[#9c3a2c]">Keep it under {MESSAGE_MAX.toLocaleString()} characters.</p>
                        )}
                        <p className="text-xs leading-relaxed text-foreground/55">{MONEY_NOTE}</p>
                    </div>
                    <div className="flex gap-3 border-t border-foreground/10 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sending} className="h-12 flex-1 rounded-lg font-semibold">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={send}
                            disabled={!canSend}
                            className="h-12 flex-[2] rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                            {sending ? "Sending…" : "Send message"}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default StartChatDialog;
