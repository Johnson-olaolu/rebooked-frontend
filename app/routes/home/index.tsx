import type { Route } from "../+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Rebooked — Every book deserves a second reader" },
    {
      name: "description",
      content:
        "List the books you've finished, find the ones you keep meaning to read, and message the person on the other end directly. No fees, no middleman.",
    },
  ];
}

const featuredBooks = [
  { title: "Half of a Yellow Sun", author: "Chimamanda Ngozi Adichie", price: "R120", place: "Rondebosch", condition: "Like new", tone: "bg-olive" },
  { title: "Organic Chemistry, 9th ed.", author: "Paula Bruice", price: "R450", place: "Hatfield", condition: "Good", tone: "bg-secondary" },
  { title: "The Master and Margarita", author: "Mikhail Bulgakov", price: "R70", place: "Melville", condition: "Fair", tone: "bg-destructive" },
  { title: "Cry, the Beloved Country", author: "Alan Paton", price: "R310", place: "Durban North", condition: "First ed.", tone: "bg-[#4a2d18]" },
];

const categories = [
  { name: "Textbooks", count: "1,482 listings" },
  { name: "Literary fiction", count: "936 listings" },
  { name: "Crime & thriller", count: "704 listings" },
  { name: "Rare & collectable", count: "118 listings" },
  { name: "Kids & young adult", count: "592 listings" },
  { name: "History & politics", count: "430 listings" },
  { name: "Poetry", count: "211 listings" },
];

const topAuthors = [
  { name: "Chimamanda Ngozi Adichie", count: 64 },
  { name: "Haruki Murakami", count: 58 },
  { name: "Deon Meyer", count: 51 },
  { name: "Toni Morrison", count: 44 },
  { name: "Zakes Mda", count: 39 },
  { name: "Sally Rooney", count: 37 },
];

const trustedSellers = [
  { initials: "NM", name: "Nadia M.", meta: "★★★★★ · 47 books rehomed" },
  { initials: "SK", name: "Sipho K.", meta: "★★★★★ · 31 books rehomed" },
  { initials: "LB", name: "Lerato B.", meta: "★★★★☆ · 28 books rehomed" },
];

const steps = [
  { number: "01", title: "Put it on the shelf", body: "Photo, condition, price. Ninety seconds and your book is in the store." },
  { number: "02", title: "Talk it over", body: "Buyers message you about that specific book. Agree a price and a place." },
  { number: "03", title: "Hand it over", body: "Meet, post, or leave it at reception. Mark it sold and it leaves the store." },
];

export function ServerComponent() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-destructive/35 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-destructive uppercase">
            No fees · no middleman
          </span>
          <h1 className="mt-6 text-4xl leading-[1.05] font-normal tracking-tight text-balance font-serif md:text-6xl">
            Every book deserves a second reader.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground/70 text-pretty">
            List the books you've finished, find the ones you keep meaning to read, and message the person on the other end directly. Rebooked introduces you — you two sort out the handover.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
              <Link to="/auth/register">List your first book</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-lg border-foreground/25 px-6 text-base font-semibold">
              <Link to="/#how-it-works">Browse the store</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-foreground/50">
            Free to list. Rebooked never handles payment — you arrange that between yourselves.
          </p>
        </div>

        <div className="relative hidden h-[380px] md:block">
          <div className="absolute top-6 left-8 h-[260px] w-[176px] -rotate-6 rounded-l border border-foreground/15 bg-secondary shadow-xl" />
          <div className="absolute top-1 left-28 h-[280px] w-[190px] rotate-3 rounded-l bg-olive shadow-xl" />
          <div className="absolute top-12 left-16 flex h-[310px] w-[214px] flex-col gap-3 rounded-l-sm rounded-r-md border border-foreground/15 bg-card p-4 shadow-2xl">
            <div className="flex flex-1 items-center justify-center rounded border border-dashed border-foreground/25 bg-background text-xs text-foreground/45">
              Cover photo
            </div>
            <div>
              <div className="font-serif text-lg">The Bell Jar</div>
              <div className="mt-1 text-xs text-foreground/55">Sylvia Plath · Good condition</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-semibold text-primary">R85</span>
              <span className="text-[11px] tracking-wide text-olive uppercase">Local pickup</span>
            </div>
          </div>
          <img
            src="/brand/rebooked-mark-ink.png"
            alt=""
            className="absolute right-0 bottom-0 h-20 w-32 object-contain opacity-10"
          />
        </div>
      </section>

      {/* Featured books */}
      <section id="how-it-works" className="border-t border-border px-6 py-14 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.14em] text-destructive uppercase">Featured this week</div>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl">Fresh on the shelf</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book) => (
              <div key={book.title} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className={`relative flex h-52 items-end p-3.5 ${book.tone}`}>
                  <span className="absolute top-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#4a2d18] uppercase">
                    {book.condition}
                  </span>
                  <span className="text-xs text-card/85">Cover photo</span>
                </div>
                <div className="p-4">
                  <div className="font-serif text-lg leading-snug">{book.title}</div>
                  <div className="mt-1 text-sm text-foreground/55">{book.author}</div>
                  <div className="mt-3.5 flex items-center justify-between">
                    <span className="font-serif text-lg font-semibold text-primary">{book.price}</span>
                    <span className="text-xs text-foreground/50">{book.place}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-border bg-secondary/60 px-6 py-14 md:px-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 font-serif text-3xl md:text-4xl">Browse by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <div key={category.name} className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-5">
                <div className="font-serif text-xl">{category.name}</div>
                <div className="text-sm text-foreground/55">{category.count}</div>
              </div>
            ))}
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-primary p-5 text-primary-foreground">
              <div className="font-serif text-xl">Near you</div>
              <div className="text-sm text-primary-foreground/70">Within 10 km</div>
            </div>
          </div>
        </div>
      </section>

      {/* Authors + trusted sellers */}
      <section className="border-t border-border px-6 py-14 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-11 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="mb-1.5 font-serif text-3xl md:text-4xl">Most-listed authors</h2>
            <p className="mb-6 text-foreground/60">What Rebooked readers are passing on right now.</p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {topAuthors.map((author, index) => (
                <div key={author.name} className="flex items-center justify-between border-b border-border py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-serif text-destructive">{index + 1}</span>
                    <span>{author.name}</span>
                  </div>
                  <span className="text-sm text-foreground/50">{author.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">Trusted sellers</div>
            <div className="mt-4 flex flex-col gap-4">
              {trustedSellers.map((seller) => (
                <div key={seller.initials} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-serif text-primary">
                    {seller.initials}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{seller.name}</div>
                    <div className="text-sm text-foreground/55">{seller.meta}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-foreground/60">
              Ratings come from completed handovers — no payment protection, so the record matters.
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-border bg-secondary/60 px-6 py-14 md:px-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 font-serif text-3xl md:text-4xl">Three steps, no shipping labels</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-lg border border-border bg-background p-6">
                <div className="font-serif text-3xl text-destructive">{step.number}</div>
                <div className="mt-2.5 mb-2 font-semibold">{step.title}</div>
                <p className="text-foreground/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
          <span className="text-foreground/65">2,847 books currently looking for a new reader.</span>
          <Button asChild size="lg" className="h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
            <Link to="/auth/register">Browse all books →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
