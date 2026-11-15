import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router";
import ConversationList from "~/components/chat/ConversationList";
import { Button } from "~/components/ui/button";
import { useChatStatus, useUnreadCount } from "~/hooks/useChat";
import { cn } from "~/lib/utils";
import type { IConversationPage } from "~/types/chat";
import EmptyState from "../components/EmptyState";

const primaryButton =
    "h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90";

/** Shown while the socket is down; sending still works (it's queued until we're back). */
export const ConnectionBar = () => {
    const status = useChatStatus();
    if (status !== "offline") return null;
    return (
        <div role="status" className="border-b border-[#9c3a2c]/20 bg-[#9c3a2c]/8 px-4 py-1.5 text-center text-xs font-medium text-[#9c3a2c]">
            Reconnecting… messages you send will go as soon as we're back.
        </div>
    );
};

/**
 * /dashboard/messages and /dashboard/messages/:id (mockups 4a–4f). Desktop: conversations on the left,
 * the open thread on the right. Mobile: one or the other.
 */
const MessagesLayout = () => {
    const { id } = useParams();
    const unread = useUnreadCount();
    const [counts, setCounts] = useState<IConversationPage["counts"]>();
    const onCounts = useCallback((next?: IConversationPage["counts"]) => setCounts(next), []);

    useEffect(() => {
        document.title = `${unread ? `(${unread}) ` : ""}Messages · Rebooked`;
    }, [unread]);

    if (!id && counts && counts.ALL === 0) {
        return (
            <div className="flex h-full items-center justify-center overflow-y-auto p-5 md:p-10">
                <div className="w-full max-w-2xl">
                    <EmptyState
                        title="No conversations yet"
                        description="When someone messages you about a book, or you message a seller, the conversation opens here: one per person, with every book you're discussing."
                        action={
                            <div className="flex flex-wrap justify-center gap-3">
                                <Button asChild variant="outline" className="h-11 rounded-md px-5 text-[15px] font-semibold">
                                    <Link to="/shop">Browse the shop</Link>
                                </Button>
                                <Button asChild className={primaryButton}>
                                    <Link to="/dashboard/shelf/new">+ Add to shelf</Link>
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    // Two full-height panes (WhatsApp-style): only the list and the messages scroll.
    return (
        <div className="flex h-full min-h-0 bg-card">
            <ConversationList
                onCounts={onCounts}
                unread={unread}
                className={cn(
                    "h-full w-full shrink-0 border-foreground/10 md:w-[22rem] md:border-r lg:w-[24rem] xl:w-[26rem]",
                    id && "hidden md:flex",
                )}
            />
            <section className={cn("h-full min-w-0 flex-1 flex-col bg-background", id ? "flex" : "hidden md:flex")}>
                <ConnectionBar />
                <Outlet />
            </section>
        </div>
    );
};

export default MessagesLayout;
