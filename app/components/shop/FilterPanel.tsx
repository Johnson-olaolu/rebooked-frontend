import { Check, Search, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import CategoryMultiSelect from "~/components/shelf/CategoryMultiSelect";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import type { ShopFilters } from "~/hooks/useShopFilters";
import { cn } from "~/lib/utils";
import type { ICategory, IShopFacets } from "~/types/book";
import { BOOK_CONDITIONS } from "~/utils/book";
import { NG_STATES, formatNgState } from "~/utils/nigeria";
import { categorySlug } from "~/utils/slug";

const STATE_OPTIONS = NG_STATES.map((state) => ({ id: state, name: state }));
/** Shown before "Show all": the busiest categories, or a sensible starter set until counts exist. */
const STARTER_CATEGORIES = [
    "Contemporary Fiction",
    "Textbooks",
    "Classic Literature",
    "Mystery & Thriller",
    "Romance",
    "Self-Help",
    "Biographies & Memoirs",
    "Business & Economics",
];
const SHORT_LIST = 8;

/** Keeps a text box responsive while only pushing to the URL once typing pauses. */
const useDebounced = (value: string, onCommit: (value: string) => void, delay = 400) => {
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);
    useEffect(() => {
        if (draft === value) return;
        const timer = setTimeout(() => onCommit(draft), delay);
        return () => clearTimeout(timer);
    }, [draft]);
    return [draft, setDraft] as const;
};

const Section = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
    <section className="border-b border-foreground/10 py-5 first:pt-0 last:border-0">
        <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-[0.14em] text-foreground/55 uppercase">{title}</h3>
            {action}
        </div>
        {children}
    </section>
);

const Count = ({ value }: { value?: number }) =>
    value === undefined ? null : <span className="ml-auto text-xs text-foreground/45 tabular-nums">{value.toLocaleString()}</span>;

export interface FilterPanelProps {
    filters: ShopFilters;
    update: (patch: Partial<ShopFilters>) => void;
    clear: () => void;
    activeCount: number;
    categories: ICategory[];
    facets?: IShopFacets;
    /** The user's own state, offered as a one-tap "Use my state". */
    myState?: string;
    /** Sections a page has fixed (e.g. a category page hides Category). */
    hide?: { category?: boolean; location?: boolean; free?: boolean };
    /** Prefix for ids so the sidebar and the mobile sheet can both be mounted. */
    idPrefix: string;
}

/** 2a sidebar: search, location (states), category, condition, price / free. */
const FilterPanel = ({ filters, update, clear, activeCount, categories, facets, myState, hide = {}, idPrefix }: FilterPanelProps) => {
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [search, setSearch] = useDebounced(filters.search, (value) => update({ search: value.trim() }));
    const [min, setMin] = useDebounced(filters.minPrice?.toString() ?? "", (value) =>
        update({ minPrice: value ? Number(value) : undefined }),
    );
    const [max, setMax] = useDebounced(filters.maxPrice?.toString() ?? "", (value) =>
        update({ maxPrice: value ? Number(value) : undefined }),
    );
    const freeId = useId();

    const counted = (category: ICategory) => facets?.categories?.[category.id] ?? category.booksCount ?? undefined;
    const ranked = [...categories].sort((a, b) => {
        const byCount = (counted(b) ?? -1) - (counted(a) ?? -1);
        if (byCount) return byCount;
        const starterA = STARTER_CATEGORIES.indexOf(a.name);
        const starterB = STARTER_CATEGORIES.indexOf(b.name);
        return (starterA === -1 ? 99 : starterA) - (starterB === -1 ? 99 : starterB) || a.name.localeCompare(b.name);
    });
    const selected = new Set(filters.categories);
    const visibleCategories = showAllCategories
        ? [...categories].sort((a, b) => a.name.localeCompare(b.name))
        : [
              ...ranked.filter((category) => selected.has(categorySlug(category))),
              ...ranked.filter((category) => !selected.has(categorySlug(category))),
          ].slice(0, Math.max(SHORT_LIST, selected.size));

    const toggleCategory = (slug: string) =>
        update({ categories: selected.has(slug) ? filters.categories.filter((item) => item !== slug) : [...filters.categories, slug] });

    const digits = (value: string) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 8);

    return (
        <div className="flex flex-col">
            <Section title="Search">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" aria-hidden />
                    <Input
                        id={`${idPrefix}-search`}
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && update({ search: search.trim() })}
                        placeholder="Title, author or ISBN"
                        aria-label="Search title, author or ISBN"
                        className="h-10 bg-card pl-9"
                    />
                </div>
            </Section>

            {!hide.location && (
                <Section
                    title="Location"
                    action={
                        filters.states.length > 0 && (
                            <button type="button" onClick={() => update({ states: [] })} className="text-xs font-semibold text-primary hover:underline">
                                Anywhere
                            </button>
                        )
                    }
                >
                    <CategoryMultiSelect
                        id={`${idPrefix}-states`}
                        categories={STATE_OPTIONS}
                        value={filters.states}
                        onChange={(states) => update({ states })}
                        placeholder="Add a state…"
                        noun="states"
                        label="States"
                    />
                    <p className="mt-2 text-xs text-foreground/55">
                        {filters.states.length === 0
                            ? "Showing books from anywhere in Nigeria."
                            : `Showing books in ${filters.states.map((state) => formatNgState(state)).join(", ")}.`}
                    </p>
                    {myState && !filters.states.includes(myState) && (
                        <button
                            type="button"
                            onClick={() => update({ states: [...filters.states, myState] })}
                            className="mt-2 text-xs font-semibold text-primary hover:underline"
                        >
                            + Add my state ({formatNgState(myState)})
                        </button>
                    )}
                </Section>
            )}

            {!hide.category && (
                <Section title="Category">
                    <ul className="flex flex-col gap-0.5">
                        <li>
                            <button
                                type="button"
                                aria-pressed={selected.size === 0}
                                onClick={() => update({ categories: [] })}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[15px] transition-colors hover:bg-secondary",
                                    selected.size === 0 && "font-semibold",
                                )}
                            >
                                All books
                            </button>
                        </li>
                        {visibleCategories.map((category) => {
                            const slug = categorySlug(category);
                            const on = selected.has(slug);
                            return (
                                <li key={category.id}>
                                    <button
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => toggleCategory(slug)}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[15px] transition-colors hover:bg-secondary",
                                            on && "bg-secondary font-semibold",
                                        )}
                                    >
                                        <span className="truncate">{category.name}</span>
                                        {on && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                                        <Count value={counted(category)} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {categories.length > SHORT_LIST && (
                        <button
                            type="button"
                            onClick={() => setShowAllCategories((value) => !value)}
                            className="mt-2 px-2 text-sm font-semibold text-primary hover:underline"
                        >
                            {showAllCategories ? "Show fewer" : `Show all ${categories.length}`}
                        </button>
                    )}
                </Section>
            )}

            <Section title="Condition">
                <div className="flex flex-col gap-2.5">
                    {BOOK_CONDITIONS.map(({ value, label }) => {
                        const id = `${idPrefix}-cond-${value}`;
                        const on = filters.conditions.includes(value);
                        return (
                            <label key={value} htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-[15px]">
                                <Checkbox
                                    id={id}
                                    checked={on}
                                    onCheckedChange={(checked) =>
                                        update({
                                            conditions: checked
                                                ? [...filters.conditions, value]
                                                : filters.conditions.filter((item) => item !== value),
                                        })
                                    }
                                />
                                {label}
                                <Count value={facets?.conditions?.[value]} />
                            </label>
                        );
                    })}
                </div>
            </Section>

            {!hide.free && (
            <Section title="Price">
                <div className={cn("flex items-center gap-2", filters.free && "pointer-events-none opacity-50")}>
                    {[
                        { label: "Min", value: min, set: setMin },
                        { label: "Max", value: max, set: setMax },
                    ].map(({ label, value, set }, index) => (
                        <div key={label} className="flex items-center gap-2">
                            {index === 1 && <span className="text-foreground/45">–</span>}
                            <div className="flex h-10 w-full items-center rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                                <span className="pl-2.5 text-sm font-semibold text-foreground/55">₦</span>
                                <input
                                    inputMode="numeric"
                                    aria-label={`${label}imum price`}
                                    placeholder={label}
                                    value={value ? Number(value).toLocaleString("en-NG") : ""}
                                    onChange={(event) => set(digits(event.target.value))}
                                    disabled={filters.free}
                                    className="h-full w-full min-w-0 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <label htmlFor={freeId} className="mt-3.5 flex cursor-pointer items-center gap-2.5 text-[15px]">
                    <button
                        id={freeId}
                        type="button"
                        role="switch"
                        aria-checked={filters.free}
                        onClick={() => update({ free: !filters.free })}
                        className={cn(
                            "relative h-6 w-10 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            filters.free ? "bg-primary" : "bg-foreground/20",
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                                filters.free && "translate-x-4",
                            )}
                        />
                    </button>
                    Free books only
                    <Count value={facets?.free} />
                </label>
            </Section>
            )}

            {activeCount > 0 && (
                <button
                    type="button"
                    onClick={clear}
                    className="mt-1 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline"
                >
                    <X className="size-4" aria-hidden /> Clear all filters
                </button>
            )}
            <p className="mt-6 rounded-lg bg-secondary/70 p-3.5 text-xs leading-relaxed text-foreground/65">
                Rebooked never handles the money. You agree the price and the handover directly with the seller.
            </p>
        </div>
    );
};

export default FilterPanel;
