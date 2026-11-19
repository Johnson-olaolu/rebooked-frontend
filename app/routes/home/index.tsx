import type { Route } from "./+types/index";
import { Link } from "react-router";
import { canonicalUrl, pageMeta } from "~/utils/seo";
import { Button } from "~/components/ui/button";
import AiPicks from "./components/AiPicks";
import ContinueBrowsing from "./components/ContinueBrowsing";
import FeaturedWeek from "./components/FeaturedWeek";
import HeroBooks from "./components/HeroBooks";
import HeroSearch from "./components/HeroSearch";
import HomeBand from "./components/HomeBand";
import HomeCategories from "./components/HomeCategories";
import NearYou from "./components/NearYou";
import NewArrivals from "./components/NewArrivals";
import ShelfCount from "./components/ShelfCount";
import SocialProof from "./components/SocialProof";
import StatsStrip from "./components/StatsStrip";
import TopAuthors from "./components/TopAuthors";
import TrendingShelf from "./components/TrendingShelf";

export function loader({ request }: Route.LoaderArgs) {
  return { url: canonicalUrl(request) };
}

export function meta({ data: loaded }: Route.MetaArgs) {
  return pageMeta({
    title: "Rebooked — Every book deserves a second reader",
    description:
      "Shelve the books you've finished, find the ones you keep meaning to read, and message the person on the other end directly. No fees, no middleman.",
    url: loaded?.url,
  });
}

const steps = [
  { number: "01", title: "Put it on the shelf", body: "Photo, condition, price. Ninety seconds and your book is in the store." },
  { number: "02", title: "Talk it over", body: "Buyers message you about that specific book. Agree a price and a place." },
  { number: "03", title: "Hand it over", body: "Meet, post, or leave it at reception. Mark it sold and it leaves the store." },
];

/*
 * Section order: homepage-implementation.md §1. Most sections read one shared GET /homepage
 * query (useHomepage, API_CHANGES #24); each hides itself when it has nothing to show.
 */
export default function Home() {
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

        <HeroBooks />
      </section>

      {/* 2. Stats counter */}
      <StatsStrip />

      {/* 3. Continue browsing (signed in) */}
      <ContinueBrowsing />

      {/* 4. Categories */}
      <HomeBand tinted>
        <HomeCategories />
      </HomeBand>

      {/* 5. Featured this week */}
      <FeaturedWeek />

      {/* 6. AI picks (personalised when signed in) */}
      <AiPicks tinted />

      {/* 7. Trending this week */}
      <TrendingShelf />

      {/* 8. New arrivals */}
      <NewArrivals tinted />

      {/* 9. Near you (signed in, with a state) */}
      <NearYou />

      {/* 10. Top authors this week */}
      <TopAuthors tinted />

      {/* 11. Readers are saying + 12. Trusted sellers */}
      <SocialProof />

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
