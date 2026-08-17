const values = [
    {
        title: "No middleman",
        body: "We never touch your money. Buyers and sellers agree on a price and handover directly — Rebooked just makes the introduction.",
    },
    {
        title: "Trust, earned",
        body: "Verified emails, ratings from completed handovers, and public seller profiles keep the community honest.",
    },
    {
        title: "Books over algorithms",
        body: "No ads, no engagement tricks. Just a clean shelf of books other readers are done with, and want in a new home.",
    },
];

const AboutUsPage = () => {
    return (
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-12 md:py-24">
            <span className="text-xs font-semibold tracking-[0.16em] text-destructive uppercase">About Rebooked</span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-balance md:text-5xl">
                We built a shelf for books other people are done with.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70 text-pretty">
                Rebooked started as a simple frustration: good books sitting unread on a shelf, while somewhere across town
                someone was hunting for exactly that title. So we built a place to list what you've finished, find what
                you've been meaning to read, and message the person on the other end — no shipping labels, no payment
                processors, no fees.
            </p>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                {values.map((value) => (
                    <div key={value.title} className="rounded-lg border border-border bg-card p-6">
                        <h2 className="font-semibold">{value.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/65">{value.body}</p>
                    </div>
                ))}
            </div>

            <div className="mt-14 rounded-xl border border-border bg-secondary/60 p-8">
                <h2 className="font-serif text-2xl">How we make money</h2>
                <p className="mt-3 leading-relaxed text-foreground/70">
                    We don't, yet — and we don't take a cut of any sale. Rebooked is free to use while we focus on building a
                    community worth trusting. If that ever changes, it won't come at the cost of the principles above.
                </p>
            </div>
        </div>
    );
};

export default AboutUsPage;
