"use client";

import { Search } from "lucide-react";
import { Form } from "react-router";

/** Hero search: submits to the shop's `?q=` search, which sorts by relevance. */
const HeroSearch = () => (
    <Form method="get" action="/shop" role="search" className="mt-8 flex max-w-lg items-center gap-2 rounded-lg border border-foreground/20 bg-card p-1.5 shadow-sm focus-within:border-primary/60">
        <Search aria-hidden className="ml-2.5 size-5 shrink-0 text-foreground/45" />
        <label htmlFor="hero-search" className="sr-only">
            Search books
        </label>
        <input
            id="hero-search"
            name="q"
            type="search"
            required
            placeholder="Title, author or ISBN"
            className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-foreground/45"
        />
        <button
            type="submit"
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
            Search
        </button>
    </Form>
);

export default HeroSearch;
