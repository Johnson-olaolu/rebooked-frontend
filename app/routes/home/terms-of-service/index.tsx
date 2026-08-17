const sections = [
    {
        title: "1. What Rebooked is",
        body: "Rebooked is a platform that lets people list secondhand books and message each other about them. We do not buy, sell, ship, or process payment for any book listed on the platform.",
    },
    {
        title: "2. Your account",
        body: "You must provide accurate information when signing up and verify your email address. You're responsible for anything posted from your account, and for keeping your password secure.",
    },
    {
        title: "3. Listings",
        body: "Listings must be for real books you own and intend to sell or give away. Misleading condition descriptions, prohibited items, or spam listings may be removed without notice.",
    },
    {
        title: "4. No payment protection",
        body: "Rebooked does not process, hold, or guarantee any payment. Any transaction you make with another user is between the two of you, at your own risk. We strongly recommend meeting in safe, public places.",
    },
    {
        title: "5. Conduct",
        body: "Harassment, discrimination, or fraudulent behaviour toward other users will result in account suspension. Ratings and reviews must reflect genuine handovers.",
    },
    {
        title: "6. Termination",
        body: "We may suspend or close accounts that violate these terms. You may close your account at any time from your settings.",
    },
];

const TermsOfServicePage = () => {
    return (
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
            <span className="text-xs font-semibold tracking-[0.16em] text-destructive uppercase">Legal</span>
            <h1 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">Terms of service</h1>
            <p className="mt-4 text-sm text-foreground/50">Last updated August 2026</p>
            <p className="mt-6 leading-relaxed text-foreground/70">
                By creating an account or using Rebooked, you agree to the terms below. Please read them alongside our{" "}
                <a href="/privacy-policy" className="font-semibold text-primary underline underline-offset-4">
                    privacy policy
                </a>
                .
            </p>

            <div className="mt-12 flex flex-col gap-10">
                {sections.map((section) => (
                    <div key={section.title}>
                        <h2 className="font-serif text-2xl">{section.title}</h2>
                        <p className="mt-3 leading-relaxed text-foreground/70">{section.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TermsOfServicePage;
