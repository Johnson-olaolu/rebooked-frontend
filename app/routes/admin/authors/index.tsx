import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AuthorStatusPill } from "~/components/admin/AuthorProfileCard";
import Pagination from "~/components/shop/Pagination";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useDebouncedValue } from "~/hooks/useDebouncedValue";
import { cn } from "~/lib/utils";
import adminAuthorService from "~/services/admin-author.service";
import type { AuthorOrigin, AuthorStatus } from "~/types/author";
import { AUTHOR_ORIGIN_LABEL, AUTHOR_SOURCE_LABEL, AUTHOR_STATUS_LABEL, AUTHOR_STATUS_TABS } from "~/utils/adminAuthor";
import { authorYears } from "~/utils/author";
import EmptyState from "~/routes/dashboard/components/EmptyState";

const PAGE_SIZE = 20;
const isStatus = (value: string | null): value is AuthorStatus => AUTHOR_STATUS_TABS.includes(value as AuthorStatus);
const isOrigin = (value: string | null): value is AuthorOrigin => !!value && value in AUTHOR_ORIGIN_LABEL;

/** /admin/authors: search the whole catalogue, by status and origin (API_CHANGES #23f). */
const AdminAuthorsPage = () => {
    const [params, setParams] = useSearchParams();
    const statusParam = params.get("status");
    const status = isStatus(statusParam) ? statusParam : undefined;
    const originParam = params.get("origin");
    const origin = isOrigin(originParam) ? originParam : undefined;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const [search, setSearch] = useState(params.get("q") ?? "");
    const q = useDebouncedValue(search.trim(), 300);

    useEffect(() => {
        document.title = "Authors · Admin · Rebooked";
    }, []);

    const setParam = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(params);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if (!("page" in changes)) next.delete("page");
        setParams(next, { replace: true, preventScrollReset: true });
    };

    // Keep the URL in step with the (debounced) search box.
    useEffect(() => {
        if ((params.get("q") ?? "") !== q) setParam({ q: q || undefined });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const listQuery = useQuery({
        queryKey: ["admin-authors", { q, status, origin, page }],
        queryFn: () => adminAuthorService.list({ q, status, origin, page: page - 1, pageSize: PAGE_SIZE }),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
    });
    const data = listQuery.data;
    const counts = data?.counts ?? {};

    const tabs: { key: AuthorStatus | undefined; label: string; count?: number }[] = [
        { key: undefined, label: "All" },
        ...AUTHOR_STATUS_TABS.map((key) => ({ key, label: AUTHOR_STATUS_LABEL[key], count: counts[key] })),
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-4xl">Authors</h1>
                    <p className="mt-1 text-foreground/60">The catalogue sellers pick from. Edits here are never overwritten by imports.</p>
                </div>
                <Button asChild variant="outline" className="h-11 rounded-md px-4 font-semibold">
                    <Link to="/admin/authors/review">Open the review queue</Link>
                </Button>
            </div>

            <div role="tablist" aria-label="Status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
                {tabs.map((tab) => {
                    const selected = tab.key === status;
                    return (
                        <button
                            key={tab.label}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setParam({ status: tab.key })}
                            className={cn(
                                "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                                selected ? "bg-[#4a2d18] font-semibold text-[#f6efe1]" : "bg-secondary hover:bg-secondary/70",
                            )}
                        >
                            {tab.label}
                            {tab.count !== undefined && <span className="ml-1.5 opacity-70">{tab.count.toLocaleString()}</span>}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or other name"
                    aria-label="Search authors"
                    className="h-11 sm:max-w-sm"
                />
                <select
                    value={origin ?? ""}
                    onChange={(event) => setParam({ origin: event.target.value || undefined })}
                    aria-label="Where the author came from"
                    className="h-11 rounded-lg border border-input bg-transparent px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    <option value="">Any origin</option>
                    {(Object.keys(AUTHOR_ORIGIN_LABEL) as AuthorOrigin[]).map((key) => (
                        <option key={key} value={key}>
                            {AUTHOR_ORIGIN_LABEL[key]}
                        </option>
                    ))}
                </select>
            </div>

            {listQuery.isError ? (
                <EmptyState
                    title="We couldn't load authors"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => listQuery.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : listQuery.isLoading ? (
                <div aria-busy className="space-y-2">
                    {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="h-18 animate-pulse rounded-lg bg-secondary" />
                    ))}
                </div>
            ) : !data?.content.length ? (
                <EmptyState title="No authors match" description="Try another name, or clear the filters." />
            ) : (
                <>
                    <p className="text-sm text-foreground/60" aria-live="polite">
                        {data.totalElements.toLocaleString()} {data.totalElements === 1 ? "author" : "authors"}
                    </p>
                    <ul className={cn("divide-y divide-foreground/10 rounded-lg border border-foreground/10 bg-card", listQuery.isPlaceholderData && "opacity-60")}>
                        {data.content.map((author) => {
                            const meta = [
                                authorYears(author),
                                author.description,
                                AUTHOR_ORIGIN_LABEL[author.origin],
                                `${(author.availableCount ?? 0).toLocaleString()} available`,
                                author.soldCount ? `${author.soldCount.toLocaleString()} sold` : "",
                                (author.sources ?? []).map((source) => AUTHOR_SOURCE_LABEL[source]).join(", "),
                            ].filter(Boolean);
                            return (
                                <li key={author.id} className="relative flex items-center gap-3 p-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link to={`/admin/authors/${author.id}`} className="font-serif text-lg after:absolute after:inset-0 hover:underline">
                                                {author.name}
                                            </Link>
                                            <AuthorStatusPill status={author.status} />
                                            {!!author.openReviewItems && (
                                                <span className="rounded-full bg-[#c4513f]/12 px-2 py-0.5 text-xs font-semibold text-[#9c3a2c]">
                                                    {author.openReviewItems} to review
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 truncate text-sm text-foreground/55">{meta.join(" · ")}</p>
                                    </div>
                                    <ChevronRight className="size-4 shrink-0 text-foreground/35" aria-hidden />
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination page={page} totalPages={data.totalPages} onChange={(next) => setParam({ page: next > 1 ? String(next) : undefined })} />
                </>
            )}
        </div>
    );
};

export default AdminAuthorsPage;
