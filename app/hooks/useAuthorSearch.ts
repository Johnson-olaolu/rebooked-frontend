import { keepPreviousData, useQuery } from "@tanstack/react-query";
import authorService from "~/services/author.service";
import { AUTHOR_SEARCH_MIN } from "~/utils/author";
import { useDebouncedValue } from "./useDebouncedValue";

/**
 * Author autocomplete: waits for typing to pause, needs 2+ letters, and keeps the last results on
 * screen while the next ones load.
 */
export const useAuthorSearch = (search: string) => {
    const term = useDebouncedValue(search.trim(), 250);
    const ready = term.length >= AUTHOR_SEARCH_MIN;
    const query = useQuery({
        queryKey: ["author-search", term],
        queryFn: () => authorService.search(term).then((response) => response.data ?? []),
        enabled: ready,
        staleTime: 60 * 1000,
        placeholderData: keepPreviousData,
    });
    return {
        term,
        ready,
        results: ready ? (query.data ?? []) : [],
        /** Still typing, or the request is out. */
        searching: search.trim() !== term || (ready && query.isFetching),
        isError: ready && query.isError,
    };
};
