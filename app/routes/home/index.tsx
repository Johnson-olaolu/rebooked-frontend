import type { Route } from "./+types/index";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import ContinueBrowsing from "./components/ContinueBrowsing";
import HeroSearch from "./components/HeroSearch";
import HomeBand from "./components/HomeBand";
import HomeCategories from "./components/HomeCategories";
import NearYou from "./components/NearYou";
import NewArrivals from "./components/NewArrivals";
import ShelfCount from "./components/ShelfCount";
import TopAuthors from "./components/TopAuthors";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Rebooked — Every book deserves a second reader" },
    {
      name: "description",
      content:
        "Shelve the books you've finished, find the ones you keep meaning to read, and message the person on the other end directly. No fees, no middleman.",
    },
  ];
}

const steps = [
  { number: "01", title: "Put it on the shelf", body: "Photo, condition, price. Ninety seconds and your book is in the store." },
  { number: "02", title: "Talk it over", body: "Buyers message you about that specific book. Agree a price and a place." },
  { number: "03", title: "Hand it over", body: "Meet, post, or leave it at reception. Mark it sold and it leaves the store." },
];

/*
 * Section order (homepage-implementation.md). Sections waiting on GET /homepage — stats,
 * featured this week, AI picks, trending, reviews, trusted sellers — slot in where noted.
 * Live sections hide themselves when they have nothing to show.
 */
export function ServerComponent() {
  return (
    <div>
      {/* 1. Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-destructive/35 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-destructive uppercase">
            No fees · no middleman
          </span>
          <h1 className="mt-6 text-4xl leading-[1.05] font-normal tracking-tight text-balance font-serif md:text-6xl">
            Every book deserves a second reader.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground/70 text-pretty">
            Shelve the books you've finished, find the ones you keep meaning to read, and message the person on the other end directly. Rebooked introduces you — you two sort out the handover.
          </p>
          <HeroSearch />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
              <Link to="/register">Start your shelf</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-lg border-foreground/25 px-6 text-base font-semibold">
              <Link to="/shop">Browse the shop</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-foreground/50">
            Free to list. Rebooked never handles payment — you arrange that between yourselves.
          </p>
        </div>

        {/* Decorative covers; replaced by this week's hero books once GET /homepage lands. */}
        <div aria-hidden className="relative hidden h-[380px] md:block">
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
              <span className="font-serif text-lg font-semibold text-primary">₦3,500</span>
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

      {/* 2. Stats counter — GET /homepage (stats) */}

      {/* 3. Continue browsing (signed in) */}
      <ContinueBrowsing />

      {/* 4. Categories */}
      <HomeBand tinted>
        <HomeCategories />
      </HomeBand>

      {/* 5. Featured this week, 6. AI picks, 7. Trending — GET /homepage */}

      {/* 8. New arrivals */}
      <NewArrivals />

      {/* 9. Near you (signed in, with a state) */}
      <NearYou tinted />

      {/* 10. Top authors */}
      <TopAuthors />

      {/* 11. Readers are saying, 12. Trusted sellers — GET /homepage */}

      {/* 13. How it works (the header links here) */}
      <HomeBand tinted id="how-it-works" className="scroll-mt-20">
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
      </HomeBand>

      {/* 14. CTA */}
      <section className="border-t border-border px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
          <ShelfCount />
          <Button asChild size="lg" className="h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)] hover:bg-primary/90">
            <Link to="/shop">Browse all books →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
