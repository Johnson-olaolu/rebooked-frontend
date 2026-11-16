import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import notificationService from "~/services/notification.service";
import { getErrorMessage } from "~/utils/https";

/** What each email is called, for "You won't get … emails any more". */
const EMAIL_NAMES: Record<string, string> = {
    WELCOME: "welcome",
    ONBOARDING_REMINDER: "profile reminder",
    BOOK_ENQUIRY: "new enquiry",
    UNREPLIED_MESSAGE: "waiting for your reply",
    SOLD_TO_YOU: "sold to you",
    BOOK_AVAILABLE: "back on the shelf",
    MARK_AS_SOLD_NUDGE: "“did it sell?”",
    STALE_LISTING: "quiet listing",
    DRAFT_REMINDER: "draft reminder",
};

/** /unsubscribe?token=…, the one-click link at the bottom of every non-account email. */
const UnsubscribePage = () => {
    const [params] = useSearchParams();
    const token = params.get("token") ?? "";
    // Unsubscribing is idempotent, so a one-off query (not retried) is the simplest fit.
    const unsubscribe = useQuery({
        queryKey: ["unsubscribe", token],
        queryFn: () => notificationService.unsubscribe(token),
        enabled: !!token,
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        document.title = "Unsubscribe · Rebooked";
    }, []);

    const name = unsubscribe.data?.data?.type ? EMAIL_NAMES[unsubscribe.data.data.type] : undefined;
    const [title, description] = !token
        ? ["This link is missing something", "Open the unsubscribe link from the email again, or copy the whole link."]
        : unsubscribe.isError
          ? ["We couldn't unsubscribe you", getErrorMessage(unsubscribe.error, "This unsubscribe link isn't valid.")]
          : unsubscribe.isSuccess
            ? [
                  "You've been unsubscribed",
                  name
                      ? `You won't get ${name} emails any more. Everything still shows up in your notifications on Rebooked.`
                      : "You won't get these emails any more. Everything still shows up in your notifications on Rebooked.",
              ]
            : ["Unsubscribing…", "One moment."];

    return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-20 text-center">
            <img src="/brand/rebooked-mark-ink.png" alt="" className="h-14 w-auto opacity-40" />
            <h1 className="mt-5 font-serif text-3xl" aria-live="polite">
                {title}
            </h1>
            <p className="mt-2 leading-relaxed text-foreground/65">{description}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline" className="h-11 rounded-md px-5 font-semibold">
                    <Link to="/">Back to Rebooked</Link>
                </Button>
                {unsubscribe.isSuccess && (
                    <Button asChild variant="ghost" className="h-11 rounded-md px-4 font-semibold">
                        <Link to="/dashboard/settings/notifications">Manage email settings</Link>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default UnsubscribePage;
