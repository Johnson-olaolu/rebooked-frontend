"use client";

import { Sparkles } from "lucide-react";
import BookShelf from "~/components/shop/BookShelf";
import { useForYou, useHomepage } from "~/hooks/useHomepage";
import type { IAiPick } from "~/types/homepage";
import HomeBand from "./HomeBand";

/**
 * Home "AI picks" (API_CHANGES #24e/#24f). Everyone sees the daily global picks from the bundle;
 * signed-in readers get their personalised ones instead once /homepage/for-you answers with
 * `personalised: true`. Hidden when there are no picks.
 */
const AiPicks = ({ tinted }: { tinted?: boolean }) => {
    const global = useHomepage((homepage) => homepage.aiPicks);
    const forYou = useForYou();
    const personal = forYou.data?.personalised ? forYou.data : null;
    const picks: IAiPick[] = personal?.aiPicks.length ? personal.aiPicks : (global.data ?? []);
    if (picks.length === 0) return null;

    const reasons = new Map(picks.map((pick) => [pick.book.id, pick.reason]));
    const basedOn = personal?.basedOn.slice(0, 3) ?? [];

    return (
        <HomeBand tinted={tinted}>
            <BookShelf
                size="large"
                className=""
                eyebrow={
                    <span className="inline-flex items-center gap-1.5">
                        <Sparkles aria-hidden className="size-3.5" /> AI picks
                    </span>
                }
                title={personal ? "Picked for you" : "Today's picks"}
                description={
                    personal && basedOn.length > 0
                        ? `Because you've been looking at ${basedOn.join(", ")}.`
                        : "Chosen by AI from what's on the shelf today."
                }
                books={picks.map((pick) => pick.book)}
                loading={false}
                error={false}
                onRetry={() => undefined}
                caption={(book) =>
                    reasons.get(book.id) ? <p className="mt-1.5 line-clamp-3 text-sm leading-snug text-foreground/60 italic">{reasons.get(book.id)}</p> : null
                }
            />
        </HomeBand>
    );
};

export default AiPicks;
