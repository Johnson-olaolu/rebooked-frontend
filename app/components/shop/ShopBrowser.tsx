import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { useShopFilters, type ShopFilters } from "~/hooks/useShopFilters";
import { cn } from "~/lib/utils";
import bookService from "~/services/book.service";
import categoryService from "~/services/category.service";
import type { ICategory, ShopSort } from "~/types/book";
import { conditionLabel } from "~/utils/book";
import { formatNaira } from "~/utils/money";
import { formatNgState, normalizeNgState } from "~/utils/nigeria";
import { categoryBySlug, categorySlug } from "~/utils/slug";
import BookCard, { BookCardSkeleton } from "./BookCard";
import FilterPanel from "./FilterPanel";
import Pagination from "./Pagination";

const PAGE_SIZE = 24;
/** 2f's quick chips on mobile; the full list is in the Filters sheet. */
const QUICK_CATEGORIES = ["Contemporary Fiction", "Textbooks", "Classic Literature", "Mystery & Thriller", "Romance", "Self-Help"];

const SORTS: { value: ShopSort; label: string }[] = [
    { value: "RELEVANCE", label: "Best match" },
    { value: "NEWEST", label: "Newest" },
    { value: "PRICE_ASC", label: "Price ↑" },
    { value: "PRICE_DESC", label: "Price ↓" },
];

/** Filters a page locks in (a category page, a state page, the free page). They're hidden from the panel. */
export interface FixedFilters {
    categoryId?: string;
    /** The author page (API_CHANGES #23d). */
    authorId?: string;
    state?: string;
    free?: boolean;
}

interface ShopBrowserProps {
    title: ReactNode;
    subtitle?: ReactNode;
    /** Above the title: breadcrumb, back link. */
    eyebrow?: ReactNode;
    /** Right of the title on desktop (e.g. "+ Add to shelf"). */
    actions?: ReactNode;
    /** Under the title: an author's bio and links. */
    intro?: ReactNode;
    fixed?: FixedFilters;
    /** Shown when there isn't a single book yet, with no filters applied. */
    emptyCatalog?: ReactNode;
}

const placeLabel = (states: string[]) => {
    if (states.length === 0) return "across Nigeria";
    if (states.length <= 2) return `in ${states.map((state) => formatNgState(state)).join(" and ")}`;
    return `in ${states.length} states`;
};

const priceLabel = ({ minPrice, maxPrice }: ShopFilters) => {
    if (minPrice !== undefined && maxPrice !== undefined) return `${formatNaira(minPrice)}–${formatNaira(maxPrice)}`;
    if (maxPrice !== undefined) return `Under ${formatNaira(maxPrice)}`;
    return `Over ${formatNaira(minPrice)}`;
};

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-card px-3 py-1 text-sm hover:border-foreground/35"
    >
        {label}
        <X className="size-3.5 text-foreground/50" aria-hidden />
    </button>
);

/** "Best match" only shows while searching. */
const SortControl = ({ value, onChange, searching }: { value: ShopSort; onChange: (sort: ShopSort) => void; searching: boolean }) => (
    <div role="radiogroup" aria-label="Sort" className="inline-flex shrink-0 rounded-lg border border-foreground/15 bg-card p-0.5">
        {SORTS.filter((sort) => searching || sort.value !== "RELEVANCE").map((sort) => (
            <button
                key={sort.value}
                type="button"
                role="radio"
                aria-checked={value === sort.value}
                onClick={() => onChange(sort.value)}
                className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors sm:px-3",
                    value === sort.value ? "bg-foreground font-semibold text-background" : "text-foreground/70 hover:text-foreground",
                )}
            >
                {sort.label}
            </button>
        ))}
    </div>
);

/** 2a / 2f: filter sidebar (a sheet on mobile) + results grid. Every shop page is one of these. */
const ShopBrowser = ({ title, subtitle, eyebrow, actions, intro, fixed = {}, emptyCatalog }: ShopBrowserProps) => {
    const { user } = useCurrentUser();
    const myState = normalizeNgState(user?.profile?.address?.state);
    // Start where the user is, unless the page is already about a place.
    const { filters, update, clear, activeCount } = useShopFilters(myState && !fixed.state ? [myState] : []);
    const [sheetOpen, setSheetOpen] = useState(false);

    const categoriesQuery = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
        select: (response) => response.data ?? [],
        staleTime: 60 * 60 * 1000,
    });
    const categories = categoriesQuery.data ?? [];
    const pickedCategories = filters.categories
        .map((slug) => categoryBySlug(categories, slug))
        .filter((category): category is ICategory => !!category);
    // Wait for the category list before querying with category filters, so slugs resolve to ids.
    const waitingForCategories = filters.categories.length > 0 && categoriesQuery.isLoading;

    const states = fixed.state ? [fixed.state] : filters.states;
    const query = {
        search: filters.search || undefined,
        authorId: fixed.authorId,
        categoryIds: fixed.categoryId ? [fixed.categoryId] : pickedCategories.map((category) => category.id),
        states,
        conditions: filters.conditions,
        minPrice: fixed.free || filters.free ? undefined : filters.minPrice,
        maxPrice: fixed.free || filters.free ? undefined : filters.maxPrice,
        free: fixed.free || filters.free,
        sort: filters.sort,
        page: filters.page - 1,
        pageSize: PAGE_SIZE,
    };
    const booksQuery = useQuery({
        queryKey: ["shop", query],
        queryFn: () => bookService.query(query),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
        enabled: !waitingForCategories,
    });
    const data = booksQuery.data;
    const total = data?.totalElements ?? 0;
    const loading = booksQuery.isLoading || waitingForCategories;

    const goToPage = (page: number) => {
        update({ page });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const chips: { key: string; label: string; remove: () => void }[] = [
        ...(filters.search ? [{ key: "q", label: `“${filters.search}”`, remove: () => update({ search: "" }) }] : []),
        ...(fixed.state
            ? []
            : filters.states.map((state) => ({
                  key: `s-${state}`,
                  label: formatNgState(state),
                  remove: () => update({ states: filters.states.filter((item) => item !== state) }),
              }))),
        ...pickedCategories.map((category) => ({
            key: `c-${category.id}`,
            label: category.name,
            remove: () => update({ categories: filters.categories.filter((slug) => categoryBySlug(categories, slug) !== category) }),
        })),
        ...(filters.conditions.length
            ? [{ key: "cond", label: filters.conditions.map(conditionLabel).join(", "), remove: () => update({ conditions: [] }) }]
            : []),
        ...(!filters.free && (filters.minPrice !== undefined || filters.maxPrice !== undefined)
            ? [{ key: "price", label: priceLabel(filters), remove: () => update({ minPrice: undefined, maxPrice: undefined }) }]
            : []),
        ...(filters.free && !fixed.free ? [{ key: "free", label: "Free only", remove: () => update({ free: false }) }] : []),
    ];

    const panelProps = {
        filters,
        update,
        clear,
        activeCount,
        categories,
        facets: data?.facets,
        myState: fixed.state ? undefined : myState,
        hide: { category: !!fixed.categoryId, location: !!fixed.state, free: !!fixed.free },
    };

    const nothingAtAll = !loading && total === 0 && activeCount === 0 && !booksQuery.isError;
    const onlyLocationNarrows = !loading && total === 0 && activeCount === filters.states.length && filters.states.length > 0;
    // A state, category or free page that's empty on its own: nothing of the visitor's to loosen.
    const pageIsEmpty = !loading && total === 0 && activeCount === 0 && !!(fixed.state || fixed.categoryId || fixed.free || fixed.authorId);

    let results: ReactNode;
    if (booksQuery.isError) {
        results = (
            <div className="rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-14 text-center">
                <h2 className="font-serif text-2xl">We couldn't load the shop</h2>
                <p className="mt-2 text-foreground/60">Check your connection and try again.</p>
                <Button variant="outline" onClick={() => booksQuery.refetch()} className="mt-5 h-11 rounded-md px-5 font-semibold">
                    Try again
                </Button>
            </div>
        );
    } else if (loading) {
        results = (
            <div aria-busy className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                    <BookCardSkeleton key={index} />
                ))}
            </div>
        );
    } else if (nothingAtAll && emptyCatalog) {
        results = emptyCatalog;
    } else if (pageIsEmpty) {
        results = (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-14 text-center">
                <img src="/brand/rebooked-mark-ink.png" alt="" className="h-12 w-auto opacity-40" />
                <h2 className="mt-5 font-serif text-2xl">
                    {fixed.state ? `No books ${placeLabel([fixed.state])} yet` : "Nothing on this shelf yet"}
                </h2>
                <p className="mt-2 max-w-md text-foreground/60">Nobody has shelved one here yet. Check back soon, or browse everything.</p>
                <Button asChild variant="outline" className="mt-5 h-11 rounded-md px-5 font-semibold">
                    <Link to="/shop?state=any">Browse the whole shop</Link>
                </Button>
            </div>
        );
    } else if (total === 0) {
        results = (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-14 text-center">
                <img src="/brand/rebooked-mark-ink.png" alt="" className="h-12 w-auto opacity-40" />
                <h2 className="mt-5 font-serif text-2xl">
                    {onlyLocationNarrows ? `No books ${placeLabel(filters.states)} yet` : "Nobody's shelved that one yet"}
                </h2>
                <p className="mt-2 max-w-md text-foreground/60">
                    {onlyLocationNarrows
                        ? "Try adding nearby states, or look across the whole country."
                        : "No books match these filters. Loosening them usually helps."}
                </p>
                <Button
                    variant="outline"
                    onClick={onlyLocationNarrows ? () => update({ states: [] }) : clear}
                    className="mt-5 h-11 rounded-md px-5 font-semibold"
                >
                    {onlyLocationNarrows ? "Search all of Nigeria" : "Clear all filters"}
                </Button>
            </div>
        );
    } else {
        results = (
            <>
                <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4", booksQuery.isPlaceholderData && "opacity-60")}>
                    {data?.content.map((book) => (
                        <li key={book.id}>
                            <BookCard book={book} />
                        </li>
                    ))}
                </ul>
                <Pagination page={filters.page} totalPages={data?.totalPages ?? 0} onChange={goToPage} />
            </>
        );
    }

    const countLine = loading
        ? "Finding books…"
        : `${total.toLocaleString()} ${total === 1 ? "book" : "books"} ${placeLabel(states)}${data?.addedToday ? ` · ${data.addedToday} added today` : ""}`;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 md:py-12">
            {eyebrow}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <h1 className="font-serif text-4xl md:text-5xl">{title}</h1>
                    {subtitle && <p className="mt-2 max-w-2xl text-foreground/65">{subtitle}</p>}
                </div>
                {actions}
            </div>
            {intro}

            <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
                {/* Desktop sidebar */}
                <aside aria-label="Filters" className="hidden lg:block">
                    <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1 pb-6">
                        <FilterPanel {...panelProps} idPrefix="side" />
                    </div>
                </aside>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-foreground/60" aria-live="polite">
                            {countLine}
                        </p>
                        <div className="flex items-center gap-2">
                            {/* Mobile / tablet: filters live in a sheet */}
                            <button
                                type="button"
                                onClick={() => setSheetOpen(true)}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-foreground/15 bg-card px-3 text-sm font-semibold lg:hidden"
                            >
                                <SlidersHorizontal className="size-4" aria-hidden />
                                Filters{activeCount > 0 && ` (${activeCount})`}
                            </button>
                            <SortControl value={filters.sort} onChange={(sort) => update({ sort })} searching={!!filters.search} />
                        </div>
                    </div>

                    {!fixed.categoryId && categories.length > 0 && (
                        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden">
                            {[
                                { id: "all", name: "All", slug: "" },
                                ...[
                                    ...pickedCategories,
                                    ...categories.filter(
                                        (category) => QUICK_CATEGORIES.includes(category.name) && !pickedCategories.includes(category),
                                    ),
                                ].map((category) => ({ id: category.id, name: category.name, slug: categorySlug(category) })),
                            ].map((chip) => {
                                const on = chip.slug ? filters.categories.includes(chip.slug) : filters.categories.length === 0;
                                return (
                                    <button
                                        key={chip.id}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() =>
                                            update({
                                                categories: !chip.slug
                                                    ? []
                                                    : on
                                                      ? filters.categories.filter((slug) => slug !== chip.slug)
                                                      : [...filters.categories, chip.slug],
                                            })
                                        }
                                        className={cn(
                                            "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                                            on ? "bg-[#4a2d18] text-[#f6efe1]" : "bg-secondary hover:bg-secondary/70",
                                        )}
                                    >
                                        {chip.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {chips.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {chips.map((chip) => (
                                <Chip key={chip.key} label={chip.label} onRemove={chip.remove} />
                            ))}
                            {chips.length > 1 && (
                                <button type="button" onClick={clear} className="ml-1 text-sm font-semibold text-primary hover:underline">
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}

                    <div className="mt-6">{results}</div>
                </div>
            </div>

            <DialogPrimitive.Root open={sheetOpen} onOpenChange={setSheetOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
                    <DialogPrimitive.Content
                        aria-describedby={undefined}
                        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-[0_-12px_40px_rgba(36,27,18,0.2)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom lg:hidden"
                    >
                        <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
                            <DialogPrimitive.Title className="font-serif text-2xl">Filters</DialogPrimitive.Title>
                            <DialogPrimitive.Close aria-label="Close filters" className="rounded-md p-1.5 hover:bg-secondary">
                                <X className="size-5" />
                            </DialogPrimitive.Close>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <FilterPanel {...panelProps} idPrefix="sheet" />
                        </div>
                        <div className="flex gap-3 border-t border-foreground/10 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                            <Button type="button" variant="outline" onClick={clear} disabled={activeCount === 0} className="h-12 flex-1 rounded-lg font-semibold">
                                Reset
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setSheetOpen(false)}
                                className="h-12 flex-[2] rounded-lg bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                                {loading ? "Show books" : `Show ${total.toLocaleString()} ${total === 1 ? "book" : "books"}`}
                            </Button>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    );
};

export default ShopBrowser;
