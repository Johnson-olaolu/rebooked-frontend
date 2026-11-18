"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import authorService from "~/services/author.service";
import { authorPath } from "~/utils/author";
import HomeBand from "./HomeBand";

/** "Most-shelved authors": the authors with the most books available right now (API_CHANGES #23c). Hidden when there are none. */
const TopAuthors = () => {
    const topQuery = useQuery({
        queryKey: ["top-authors"],
        queryFn: () => authorService.top(6).then((response) => response.data ?? []),
        staleTime: 10 * 60 * 1000,
    });
    const authors = topQuery.data ?? [];
    if (!topQuery.isLoading && authors.length === 0) return null;

    return (
        <HomeBand>
            <h2 className="mb-1.5 font-serif text-3xl md:text-4xl">Most-shelved authors</h2>
            <p className="mb-6 text-foreground/60">What Rebooked readers are passing on right now.</p>
            <ol className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3" aria-busy={topQuery.isLoading}>
                {topQuery.isLoading
                    ? Array.from({ length: 6 }, (_, index) => (
                          <li key={index} className="h-11 animate-pulse border-b border-border py-2.5">
                              <div className="h-4 w-3/4 rounded bg-secondary" />
                          </li>
                      ))
                    : authors.map((author, index) => (
                          <li key={author.id} className="border-b border-border">
                              <Link to={authorPath(author)} className="group flex items-center justify-between gap-3 py-2.5">
                                  <span className="flex min-w-0 items-center gap-3">
                                      <span className="w-5 font-serif text-destructive">{index + 1}</span>
                                      <span className="truncate group-hover:underline">{author.name}</span>
                                  </span>
                                  <span className="shrink-0 text-sm text-foreground/50">
                                      {(author.availableCount ?? 0).toLocaleString()}
                                      <span className="sr-only"> books available</span>
                                  </span>
                              </Link>
                          </li>
                      ))}
            </ol>
        </HomeBand>
    );
};

export default TopAuthors;
