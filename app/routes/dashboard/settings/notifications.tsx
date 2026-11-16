import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { useBaseStore } from "~/hooks/store";
import { useNotificationPreferences, useUpdateNotificationPreference } from "~/hooks/useNotifications";
import type { INotificationPreference, NotificationCategory, NotificationChannel } from "~/types/notification";
import { capitalizeFirst } from "~/utils/text";
import EmptyState from "../components/EmptyState";
import SettingsHeader from "./SettingsHeader";

const CHANNELS: { value: NotificationChannel; label: string; name: string }[] = [
    { value: "IN_APP", label: "In-app", name: "in the app" },
    { value: "EMAIL", label: "Email", name: "by email" },
];

const SECTIONS: { category: NotificationCategory; title: string }[] = [
    { category: "CHAT", title: "Messages" },
    { category: "SALES", title: "Sales" },
    { category: "LISTINGS", title: "Your shelf" },
    { category: "ACCOUNT", title: "Account" },
];

/** What each switch row says. Order here is the order on the page. */
const COPY: Record<string, { label: string; description: string }> = {
    BOOK_ENQUIRY: { label: "New enquiries", description: "Someone asks about one of your books" },
    NEW_MESSAGES: { label: "Messages while you're away", description: "Grouped per chat, like “Tunde sent you 3 messages”" },
    UNREPLIED_MESSAGE: { label: "Waiting for your reply", description: "A message has gone unanswered for 30 minutes" },
    SOLD_TO_YOU: { label: "Sold to you", description: "A seller marks a book as sold to you" },
    SOLD_ELSEWHERE: { label: "Sold to someone else", description: "A book you asked about went to another buyer" },
    BOOK_UNAVAILABLE: { label: "No longer available", description: "A book you asked about was archived or removed" },
    BOOK_AVAILABLE: { label: "Back on the shelf", description: "A book you asked about is available again" },
    MARK_AS_SOLD_NUDGE: { label: "Did it sell?", description: "A check-in when a chat about your book goes quiet" },
    STALE_LISTING: { label: "Quiet listings", description: "A book has had no enquiries for 30 days, with tips to help it sell" },
    DRAFT_REMINDER: { label: "Unfinished drafts", description: "A draft you haven't published for 3 days" },
    VIEWS_MILESTONE: { label: "Views milestones", description: "A book reaches 50, 100, 500 or 1,000 views" },
};

/** Sent once around sign-up, so there's nothing to switch off by the time you're here. */
const HIDDEN = new Set(["WELCOME", "ONBOARDING_REMINDER"]);

const order = (type: string) => {
    const index = Object.keys(COPY).indexOf(type);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

// A type the backend adds before this page knows it still gets a row.
const copyFor = (type: string) =>
    COPY[type] ?? { label: capitalizeFirst(type.toLowerCase().replace(/_/g, " ")), description: "" };

const ColumnLabels = () => (
    <div className="flex shrink-0 gap-2 text-xs font-semibold tracking-wide text-foreground/50 uppercase" aria-hidden>
        {CHANNELS.map((channel) => (
            <span key={channel.value} className="w-14 text-center">
                {channel.label}
            </span>
        ))}
    </div>
);

const PreferenceRow = ({ preference }: { preference: INotificationPreference }) => {
    const update = useUpdateNotificationPreference();
    const { label, description } = copyFor(preference.type);
    return (
        <li className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
                <p className="font-semibold">{label}</p>
                {description && <p className="mt-0.5 text-sm leading-relaxed text-foreground/55">{description}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
                {CHANNELS.map((channel) => {
                    const enabled = preference.channels[channel.value];
                    return (
                        <div key={channel.value} className="flex w-14 justify-center">
                            {enabled === undefined ? (
                                <span className="text-foreground/30" title={`Not sent ${channel.name}`}>
                                    <span aria-hidden>–</span>
                                    <span className="sr-only">Not sent {channel.name}</span>
                                </span>
                            ) : (
                                <Switch
                                    checked={enabled}
                                    aria-label={`${label} ${channel.name}`}
                                    onCheckedChange={(checked) =>
                                        update.mutate({ type: preference.type, channel: channel.value, enabled: checked })
                                    }
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </li>
    );
};

/** /dashboard/settings/notifications: which notifications you get, in the app and by email. Each switch saves on its own. */
const NotificationSettingsPage = () => {
    const email = useBaseStore((state) => state.user?.email);
    const query = useNotificationPreferences();

    useEffect(() => {
        document.title = "Notification settings · Rebooked";
    }, []);

    const visible = (query.data ?? []).filter((item) => !HIDDEN.has(item.type));
    const known = new Set(SECTIONS.map((section) => section.category));
    const sections = [
        ...SECTIONS,
        // Same for a category this page doesn't know yet.
        ...[...new Set(visible.map((item) => item.category))]
            .filter((category) => !known.has(category))
            .map((category) => ({ category, title: capitalizeFirst(category.toLowerCase()) })),
    ]
        .map((section) => ({
            ...section,
            items: visible.filter((item) => item.category === section.category).sort((a, b) => order(a.type) - order(b.type)),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <div className="flex flex-col gap-6">
            <SettingsHeader description="Choose what we let you know about, and where." />

            {query.isError ? (
                <EmptyState
                    title="We couldn't load your settings"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => query.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : query.isLoading ? (
                <div aria-busy className="space-y-6">
                    {Array.from({ length: 2 }, (_, index) => (
                        <div key={index} className="overflow-hidden rounded-lg border border-foreground/10 bg-card">
                            {Array.from({ length: 3 }, (_, row) => (
                                <div key={row} className="flex items-center gap-4 border-b border-foreground/8 px-5 py-4 last:border-0">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
                                        <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                                    </div>
                                    <div className="h-6 w-11 animate-pulse rounded-full bg-secondary" />
                                    <div className="h-6 w-11 animate-pulse rounded-full bg-secondary" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {sections.map((section) => (
                        <section key={section.category} aria-labelledby={`prefs-${section.category}`}>
                            <div className="mb-2 flex items-end justify-between gap-4 px-5">
                                <h2 id={`prefs-${section.category}`} className="font-serif text-xl">
                                    {section.title}
                                </h2>
                                <ColumnLabels />
                            </div>
                            <ul className="divide-y divide-foreground/8 overflow-hidden rounded-lg border border-foreground/10 bg-card">
                                {section.items.map((preference) => (
                                    <PreferenceRow key={preference.type} preference={preference} />
                                ))}
                            </ul>
                        </section>
                    ))}
                    <p className="px-1 text-sm leading-relaxed text-foreground/55">
                        {email ? (
                            <>
                                Emails go to <span className="font-semibold text-foreground/75">{email}</span>.{" "}
                            </>
                        ) : null}
                        Emails about your account, like sign-up codes and password changes, are always sent.
                    </p>
                </>
            )}
        </div>
    );
};

export default NotificationSettingsPage;
