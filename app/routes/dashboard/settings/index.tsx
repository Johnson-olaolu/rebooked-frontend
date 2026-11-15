import UserAvatar, { getDisplayName } from "~/components/UserAvatar";
import { useBaseStore } from "~/hooks/store";

const Row = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col gap-1 border-b border-foreground/10 py-4 last:border-0 sm:flex-row sm:gap-6">
        <dt className="w-40 shrink-0 text-sm text-foreground/55">{label}</dt>
        <dd className={value ? "" : "text-foreground/40"}>{value || "Not set"}</dd>
    </div>
);

const SettingsPage = () => {
    const user = useBaseStore((state) => state.user);
    const address = user?.profile?.address;
    const location = [address?.city, address?.state].filter(Boolean).join(", ");

    return (
        <>
            <h1 className="font-serif text-3xl md:text-4xl">Profile settings</h1>
            <p className="mt-1.5 mb-6 text-foreground/60">Editing your profile is coming soon.</p>

            <section className="rounded-lg border border-foreground/10 bg-card p-6">
                <div className="flex items-center gap-4">
                    <UserAvatar user={user} className="size-16 text-xl" />
                    <div>
                        <div className="font-serif text-2xl">{getDisplayName(user)}</div>
                        <div className="text-sm text-foreground/55">{user?.email}</div>
                    </div>
                </div>
                <dl className="mt-4">
                    <Row label="Display name" value={user?.profile?.userName} />
                    <Row label="Full name" value={user?.fullName} />
                    <Row label="Email" value={user?.email} />
                    <Row label="Location" value={location} />
                    <Row label="Street address" value={address?.addressLine} />
                </dl>
            </section>
        </>
    );
};

export default SettingsPage;
