import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import UserAvatar from "~/components/UserAvatar";
import { useHomepage } from "~/hooks/useHomepage";
import authorService from "~/services/author.service";
import type { IAuthorSummary } from "~/types/author";
import { authorPath } from "~/utils/author";
import HomeBand from "./HomeBand";

type ListedAuthor = IAuthorSummary & { photoUrl?: string | null };

/**
 * Home "Top authors this week" (API_CHANGES #24d), with photos. Falls back to the most-shelved
 * authors (GET /author/top, #23c) when the bundle has no weekly list. Hidden when both are empty.
 */
const TopAuthors = ({ tinted }: { tinted?: boolean }) => {
    const weekly = useHomepage((homepage) => homepage.topAuthors);
    const useFallback = weekly.isError || (weekly.isSuccess && weekly.data.length === 0);
    const fallback = useQuery({
        queryKey: ["top-authors"],
        queryFn: () => authorService.top(6).then((response) => response.data ?? []),
        staleTime: 10 * 60 * 1000,
        enabled: useFallback,
    });

    const authors: ListedAuthor[] = useFallback ? (fallback.data ?? []) : (weekly.data ?? []);
    const loading = weekly.isLoading || (useFallback && fallback.isLoading);
    if (!loading && authors.length === 0) return null;

    return (
        <HomeBand tinted={tinted}>
            <h2 className="mb-1.5 font-serif text-3xl md:text-4xl">{useFallback ? "Most-shelved authors" : "Top authors this week"}</h2>
            <p className="mb-6 text-foreground/60">
                {useFallback
                    ? "What Rebooked readers are passing on right now."
                    : "Ranked by what readers viewed, bought and shelved over the last 7 days."}
            </p>
            <ol className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
                {loading
                    ? Array.from({ length: 6 }, (_, index) => (
                          <li key={index} className="flex h-14 animate-pulse items-center gap-3 border-b border-border">
                              <div className="size-9 rounded-full bg-secondary" />
                              <div className="h-4 w-1/2 rounded bg-secondary" />
                          </li>
                      ))
                    : authors.map((author, index) => (
                          <li key={author.id} className="border-b border-border">
                              <Link to={authorPath(author)} className="group flex items-center justify-between gap-3 py-2.5">
                                  <span className="flex min-w-0 items-center gap-3">
                                      <span className="w-5 font-serif text-destructive">{index + 1}</span>
                                      <UserAvatar name={author.name} photoUrl={author.photoUrl} className="size-9" />
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
