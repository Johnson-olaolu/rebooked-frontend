const sections = [
    {
        title: "What we collect",
        body: "Your name, email address, and approximate location (city/suburb) when you create an account. Photos and descriptions you add to a listing. Messages you send through Rebooked, so we can moderate abuse and resolve disputes.",
    },
    {
        title: "What we don't collect",
        body: "We never process payments, so we never see or store your card, bank, or payment details. Rebooked is strictly an introduction service between buyer and seller.",
    },
    {
        title: "How we use it",
        body: "To run your account, show your listings in the store, connect you with other readers, and keep the platform safe. We don't sell your data to third parties or use it for ad targeting.",
    },
    {
        title: "Who can see it",
        body: "Your display name, photo, city/suburb, and listings are public. Your exact address and email are never shown to other users — conversations happen through Rebooked messaging.",
    },
    {
        title: "Your choices",
        body: "You can edit or delete your profile information at any time from your account settings, and request a full export or deletion of your data by contacting us.",
    },
];

const PrivacyPolicyPage = () => {
    return (
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
            <span className="text-xs font-semibold tracking-[0.16em] text-destructive uppercase">Legal</span>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Privacy policy</h1>
            <p className="mt-4 text-sm text-foreground/50">Last updated August 2026</p>
            <p className="mt-6 leading-relaxed text-foreground/70">
                This policy explains what information Rebooked collects, why we collect it, and how you're in control of it.
                Rebooked never handles payments, so our footprint on your personal data is deliberately small.
            </p>

            <div className="mt-12 flex flex-col gap-10">
                {sections.map((section) => (
                    <div key={section.title}>
                        <h2 className="font-serif text-2xl">{section.title}</h2>
                        <p className="mt-3 leading-relaxed text-foreground/70">{section.body}</p>
                    </div>
                ))}
            </div>

            <div className="mt-14 rounded-xl border border-border bg-secondary/60 p-6 text-sm leading-relaxed text-foreground/65">
                Questions about this policy or your data? Reach out through our{" "}
                <a href="/contact-us" className="font-semibold text-primary underline underline-offset-4">
                    contact page
                </a>
                .
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
