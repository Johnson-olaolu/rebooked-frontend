import { MessageSquare } from "lucide-react";

/** Desktop right pane before a conversation is picked (mobile shows only the list). */
const MessagesIndex = () => (
    <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <MessageSquare className="size-10 text-foreground/25" aria-hidden />
        <p className="mt-4 font-serif text-2xl">Pick a conversation</p>
        <p className="mt-1.5 max-w-xs text-sm text-foreground/55">
            Every book you're discussing with someone sits in one thread with them.
        </p>
    </div>
);

export default MessagesIndex;
