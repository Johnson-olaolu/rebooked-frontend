import { Button } from "~/components/ui/button";
import { getDisplayName } from "~/components/UserAvatar";
import { useBaseStore } from "~/hooks/store";
import { listBookSoon } from "./components/actions";

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const STATS = [
    { label: "Active listings", value: "0", hint: "List your first book" },
    { label: "In conversation", value: "0", hint: "No open chats" },
    { label: "Unread messages", value: "0", hint: "You're all caught up" },
    { label: "Sold all time", value: "0", hint: "—" },
];

const DashboardOverview = () => {
    const user = useBaseStore((state) => state.user);
    const firstName = getDisplayName(user).split(" ")[0];

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl">
                        {greeting()}
                        {firstName ? `, ${firstName}` : ""}
                    </h1>
                    <p className="mt-1.5 text-foreground/60">Nothing needs your attention right now.</p>
                </div>
                {/* Full-width on mobile (mockup 3f), top-right on desktop (mockup 3a). */}
                <Button
                    onClick={listBookSoon}
                    className="h-11 w-full rounded-md bg-primary md:w-auto px-5 text-[15px] font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90"
                >
                    + List a book
                </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {STATS.map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-foreground/10 bg-card p-5">
                        <div className="text-sm text-foreground/60">{stat.label}</div>
                        <div className="mt-1 font-serif text-4xl text-primary">{stat.value}</div>
                        <div className="mt-1 text-xs text-foreground/50">{stat.hint}</div>
                    </div>
                ))}
            </div>

            <section className="mt-8 rounded-lg border border-foreground/10 bg-card p-6">
                <h2 className="font-serif text-xl">Needs your attention</h2>
                <p className="mt-2 text-sm text-foreground/55">
                    Replies and books waiting to be marked as sold will show up here.
                </p>
            </section>
        </>
    );
};

export default DashboardOverview;
