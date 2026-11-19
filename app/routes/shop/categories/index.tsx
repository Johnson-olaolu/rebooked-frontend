import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import Breadcrumb from "~/components/shop/Breadcrumb";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import categoryService from "~/services/category.service";
import { categoryPath } from "~/utils/slug";
import { canonicalUrl, pageMeta, SITE_NAME } from "~/utils/seo";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
    return { url: canonicalUrl(request) };
}

export function meta({ data: loaded }: Route.MetaArgs) {
    return pageMeta({
        title: `Browse books by category · ${SITE_NAME}`,
        description:
            "Every category of second-hand book on Rebooked, from fiction and textbooks to cookery — busiest first. Find what you want to read next.",
        url: loaded?.url,
    });
}

/** /shop/categories — every category as a tile, busiest first once counts are available. */
const CategoriesPage = () => {
    const [search, setSearch] = useState("");
    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
    });

    const term = search.trim().toLowerCase();
    const categories = [...(categoriesQuery.data ?? [])]
        .filter((category) => !term || category.name.toLowerCase().includes(term))
        .sort((a, b) => (b.booksCount ?? 0) - (a.booksCount ?? 0) || a.name.localeCompare(b.name));

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 md:py-12">
            <Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: "Categories" }]} />
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-4xl md:text-5xl">Browse by category</h1>
                    <p className="mt-2 text-foreground/65">From textbooks to thrillers: pick a shelf to browse.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" aria-hidden />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Find a category"
                        aria-label="Find a category"
                        className="h-11 bg-card pl-9"
                    />
                </div>
            </div>

            {categoriesQuery.isError ? (
                <div className="mt-10 rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-14 text-center">
                    <h2 className="font-serif text-2xl">We couldn't load the categories</h2>
                    <Button variant="outline" onClick={() => categoriesQuery.refetch()} className="mt-5 h-11 rounded-md px-5 font-semibold">
                        Try again
                    </Button>
                </div>
            ) : categoriesQuery.isLoading ? (
                <div aria-busy className="mt-8 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 12 }, (_, index) => (
                        <div key={index} className="h-24 animate-pulse rounded-lg bg-secondary" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <p className="mt-10 text-foreground/60">No categories match “{search}”.</p>
            ) : (
                <ul className="mt-8 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
                    {categories.map((category) => (
                        <li key={category.id}>
                            <Link
                                to={categoryPath(category)}
                                className="flex h-full flex-col gap-1.5 rounded-lg border border-foreground/10 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary/40"
                            >
                                <span className="font-serif text-xl leading-snug">{category.name}</span>
                                <span className="text-sm text-foreground/55">
                                    {typeof category.booksCount === "number"
                                        ? `${category.booksCount.toLocaleString()} ${category.booksCount === 1 ? "book" : "books"}`
                                        : "Browse →"}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CategoriesPage;
