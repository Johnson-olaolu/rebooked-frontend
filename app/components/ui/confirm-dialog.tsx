import type { ReactNode } from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

const CONFIRM_TONE = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    olive: "bg-olive text-white hover:bg-olive/90",
    destructive: "bg-destructive text-white hover:bg-destructive/90",
} as const;

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description: ReactNode;
    confirmLabel: string;
    pendingLabel?: string;
    cancelLabel?: string;
    tone?: keyof typeof CONFIRM_TONE;
    /** While true the dialog can't be dismissed and the confirm button shows `pendingLabel`. */
    pending?: boolean;
    onConfirm: () => void;
}

/** A blocking yes/no question (radix AlertDialog). The parent closes it once the action succeeds. */
const ConfirmDialog = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    pendingLabel = "Working…",
    cancelLabel = "Cancel",
    tone = "primary",
    pending = false,
    onConfirm,
}: ConfirmDialogProps) => (
    <AlertDialogPrimitive.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
        <AlertDialogPrimitive.Portal>
            <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-foreground/10 bg-card p-6 shadow-[0_24px_60px_rgba(36,27,18,0.25)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                <AlertDialogPrimitive.Title className="font-serif text-2xl">{title}</AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="mt-2 text-[15px] text-foreground/70">
                    {description}
                </AlertDialogPrimitive.Description>
                <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <AlertDialogPrimitive.Cancel
                        disabled={pending}
                        className="h-11 rounded-md border border-foreground/15 px-4 font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
                    >
                        {cancelLabel}
                    </AlertDialogPrimitive.Cancel>
                    <AlertDialogPrimitive.Action
                        disabled={pending}
                        onClick={(event) => {
                            // Stay open until the action finishes; the parent closes it on success.
                            event.preventDefault();
                            onConfirm();
                        }}
                        className={cn(
                            "h-11 rounded-md px-5 font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] transition-colors disabled:opacity-60",
                            CONFIRM_TONE[tone],
                        )}
                    >
                        {pending ? pendingLabel : confirmLabel}
                    </AlertDialogPrimitive.Action>
                </div>
            </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
);

export default ConfirmDialog;
