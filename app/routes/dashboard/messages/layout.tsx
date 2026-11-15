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
            <>
                <h1 className="mb-6 font-serif text-3xl md:text-4xl">Conversations</h1>
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
            </>
        );
    }

    return (
        <>
            <div className={cn("mb-5", id && "hidden md:block")}>
                <h1 className="font-serif text-3xl md:text-4xl">Conversations</h1>
                <p className="mt-1.5 text-foreground/60">
                    {unread ? `${unread} unread · ` : ""}one conversation per person, with every book you're discussing
                </p>
            </div>
            <div
                className={cn(
                    "flex min-h-[28rem] overflow-hidden rounded-xl border border-foreground/10 bg-card",
                    // Fill the viewport below the header (mobile: minus the top bar and tab bar).
                    // Mobile thread: edge to edge between the top bar (~61px) and the tab bar (~65px).
                    id
                        ? "-mx-5 -mt-8 -mb-28 h-[calc(100dvh-7.9rem)] rounded-none border-x-0 border-y-0 md:mx-0 md:my-0 md:rounded-xl md:border"
                        : "h-[calc(100dvh-17rem)]",
                    "md:h-[calc(100dvh-13rem)]",
                )}
            >
                <ConversationList
                    compact
                    onCounts={onCounts}
                    className={cn("w-full border-foreground/10 md:w-[22rem] md:shrink-0 md:border-r", id && "hidden md:flex")}
                />
                <section className={cn("min-w-0 flex-1 flex-col", id ? "flex" : "hidden md:flex")}>
                    <ConnectionBar />
                    <Outlet />
                </section>
            </div>
        </>
    );
};

export default MessagesLayout;
