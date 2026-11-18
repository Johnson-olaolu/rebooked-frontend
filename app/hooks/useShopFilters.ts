import { useRef } from "react";
import { useSearchParams } from "react-router";
import type { BookCondition, ShopSort } from "~/types/book";
import { BOOK_CONDITIONS } from "~/utils/book";
import { normalizeNgState } from "~/utils/nigeria";

/** Everything the shop can filter by. It lives in the URL so results can be shared and Back works. */
export interface ShopFilters {
    search: string;
    /** Category slugs. */
    categories: string[];
    /** Canonical state names. Empty = anywhere in Nigeria. */
    states: string[];
    conditions: BookCondition[];
    minPrice?: number;
    maxPrice?: number;
    free: boolean;
    sort: ShopSort;
    /** 1-based in the URL and UI; the API is 0-based. */
    page: number;
}

const SORT_PARAM: Record<ShopSort, string> = {
    NEWEST: "newest",
    PRICE_ASC: "price_asc",
    PRICE_DESC: "price_desc",
    RELEVANCE: "relevance",
};

/** A search sorts by "Best match" unless the visitor picks something else; browsing sorts newest first. */
export const defaultSort = (search: string): ShopSort => (search ? "RELEVANCE" : "NEWEST");
const ANYWHERE = "any";

const list = (value: string | null) => (value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []);
const amount = (value: string | null) => {
    const number = Number(value);
    return value && Number.isFinite(number) && number >= 0 ? Math.round(number) : undefined;
};

const parse = (params: URLSearchParams, defaultStates: string[]): ShopFilters => {
    const stateParam = params.get("state");
    const states =
        stateParam === null
            ? defaultStates
            : stateParam === ANYWHERE
              ? []
              : list(stateParam)
                    .map((state) => normalizeNgState(state))
                    .filter((state): state is NonNullable<typeof state> => !!state);
    const search = params.get("q")?.trim() ?? "";
    const sortParam = params.get("sort");
    const picked = (Object.keys(SORT_PARAM) as ShopSort[]).find((key) => SORT_PARAM[key] === sortParam);
    // "Best match" means nothing without a search.
    const sort = picked && !(picked === "RELEVANCE" && !search) ? picked : defaultSort(search);
    const conditions = list(params.get("cond")).filter((value): value is BookCondition =>
        BOOK_CONDITIONS.some((condition) => condition.value === value),
    );
    return {
        search,
        categories: list(params.get("cat")),
        states: [...new Set(states)],
        conditions,
        minPrice: amount(params.get("min")),
        maxPrice: amount(params.get("max")),
        free: params.get("free") === "1",
        sort,
        page: Math.max(1, Math.floor(Number(params.get("page"))) || 1),
    };
};

const serialize = (filters: ShopFilters, defaultStates: string[]) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.categories.length) params.set("cat", filters.categories.join(","));
    // Only write the state when it differs from the default, so plain /shop stays clean.
    const sameAsDefault =
        filters.states.length === defaultStates.length && filters.states.every((state) => defaultStates.includes(state));
    if (!sameAsDefault) params.set("state", filters.states.length ? filters.states.join(",") : ANYWHERE);
    if (filters.conditions.length) params.set("cond", filters.conditions.join(","));
    if (filters.minPrice !== undefined) params.set("min", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("max", String(filters.maxPrice));
    if (filters.free) params.set("free", "1");
    if (filters.sort !== defaultSort(filters.search)) params.set("sort", SORT_PARAM[filters.sort]);
    if (filters.page > 1) params.set("page", String(filters.page));
    return params;
};

export const EMPTY_FILTERS: Omit<ShopFilters, "states"> = {
    search: "",
    categories: [],
    conditions: [],
    minPrice: undefined,
    maxPrice: undefined,
    free: false,
    sort: "NEWEST",
    page: 1,
};

/**
 * Reads and writes the shop filters in the URL. `defaultStates` applies when the URL doesn't say
 * (a logged-in user's own state); clearing the location writes `state=any` so it sticks.
 */
export const useShopFilters = (defaultStates: string[] = []) => {
    const [params, setParams] = useSearchParams();
    const filters = parse(params, defaultStates);

    // Two debounced inputs (min and max price) can commit back to back, before the URL from the
    // first has rendered. Build each change on the newest filters, and only fall back to the URL
    // once it has caught up with what we last wrote.
    const latest = useRef(filters);
    const pending = useRef<string | null>(null);
    if (pending.current === null || pending.current === params.toString()) {
        latest.current = filters;
        pending.current = null;
    }

    const set = (change: (current: ShopFilters) => ShopFilters) => {
        const next = change(latest.current);
        const serialized = serialize(next, defaultStates);
        latest.current = next;
        pending.current = serialized.toString();
        setParams(serialized, { preventScrollReset: true });
    };

    /** Any filter change goes back to page 1; pass `page` alone to paginate. */
    const update = (patch: Partial<ShopFilters>) =>
        set((current) => {
            const next = { ...current, page: 1, ...patch };
            // Starting or clearing a search moves an unpicked sort to the new default ("Best match" / newest).
            if (patch.search !== undefined && patch.sort === undefined && current.sort === defaultSort(current.search)) {
                next.sort = defaultSort(next.search);
            }
            return next;
        });

    /** Clears every filter, location included (a picked sort is kept, except "Best match", which needs a search). */
    const clear = () =>
        set((current) => ({ ...EMPTY_FILTERS, states: [], sort: current.sort === "RELEVANCE" ? "NEWEST" : current.sort }));

    const activeCount =
        (filters.search ? 1 : 0) +
        filters.categories.length +
        filters.states.length +
        filters.conditions.length +
        (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
        (filters.free ? 1 : 0);

    return { filters, update, clear, activeCount };
};
