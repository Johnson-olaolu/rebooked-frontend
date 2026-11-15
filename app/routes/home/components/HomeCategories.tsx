"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import categoryService from "~/services/category.service";
import { formatNgState, normalizeNgState } from "~/utils/nigeria";
import { categoryPath, statePath } from "~/utils/slug";

const FEATURED = ["Textbooks", "Contemporary Fiction", "Mystery & Thriller", "Rare & Collectible Editions", "Young Adult Contemporary", "History", "Poetry"];
const SHOWN = 7;

/** Home "Browse by category": live categories (busiest first once counts exist) + a "Near you" tile. */
const HomeCategories = () => {
    const { user } = useCurrentUser();
    const myState = normalizeNgState(user?.profile?.address?.state);
    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
    });
    const all = categoriesQuery.data ?? [];
    const rank = (name: string) => (FEATURED.includes(name) ? FEATURED.indexOf(name) : 99);
    const tiles = [...all]
        .sort((a, b) => (b.booksCount ?? 0) - (a.booksCount ?? 0) || rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
        .slice(0, SHOWN);

    return (
        <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-serif text-3xl md:text-4xl">Browse by category</h2>
                <Link to="/shop/categories" className="font-semibold text-primary hover:underline">
                    All {all.length || ""} categories →
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {categoriesQuery.isLoading
                    ? Array.from({ length: SHOWN }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-background" />)
                    : tiles.map((category) => (
                          <Link
                              key={category.id}
                              to={categoryPath(category)}
                              className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/40"
                          >
                              <span className="font-serif text-xl">{category.name}</span>
                              <span className="text-sm text-foreground/55">
                                  {typeof category.booksCount === "number"
                                      ? `${category.booksCount.toLocaleString()} ${category.booksCount === 1 ? "book" : "books"}`
                                      : "Browse →"}
                              </span>
                          </Link>
                      ))}
                <Link
                    to={myState ? statePath(myState) : "/shop"}
                    className="flex flex-col gap-1.5 rounded-lg border border-border bg-primary p-5 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <span className="font-serif text-xl">Near you</span>
                    <span className="text-sm text-primary-foreground/70">
                        {myState ? `Books in ${formatNgState(myState)}` : "Pick your state in the shop"}
                    </span>
                </Link>
            </div>
        </>
    );
};

export default HomeCategories;
