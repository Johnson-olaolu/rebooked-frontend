import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AuthorProfileCard from "~/components/admin/AuthorProfileCard";
import MergeAuthorsDialog from "~/components/admin/MergeAuthorsDialog";
import Pagination from "~/components/shop/Pagination";
import { Button } from "~/components/ui/button";
import ConfirmDialog from "~/components/ui/confirm-dialog";
import { useAdminAuthorActions } from "~/hooks/useAdminAuthors";
import { cn } from "~/lib/utils";
import adminAuthorService from "~/services/admin-author.service";
import type { IAuthorReviewItem, ReviewItemType } from "~/types/author";
import { REVIEW_TYPE_LABEL } from "~/utils/adminAuthor";
import { timeAgo } from "~/utils/time";
import EmptyState from "~/routes/dashboard/components/EmptyState";

const TYPE_TABS: { key?: ReviewItemType; label: string }[] = [
    { label: "All" },
    { key: "PROPOSAL", label: "New authors" },
    { key: "POSSIBLE_DUPLICATE", label: "Possible duplicates" },
    { key: "MIGRATION_AMBIGUOUS", label: "Unclear matches" },
];
const isType = (value: string | null): value is ReviewItemType => !!value && value in REVIEW_TYPE_LABEL;

type MergeTarget = { from: { id: string; name: string }; into: { id: string; name: string } | null };

const outlineButton = "h-10 rounded-md px-3.5 font-semibold";

const ReviewCard = ({
    item,
    onMerge,
    onDelete,
}: {
    item: IAuthorReviewItem;
    onMerge: (target: MergeTarget) => void;
    onDelete: (item: IAuthorReviewItem) => void;
}) => {
    const { verify, keepSeparate } = useAdminAuthorActions();
    const { author, otherAuthor } = item;
    const pair = item.type !== "PROPOSAL" && !!otherAuthor;
    const busy = verify.isPending || keepSeparate.isPending;

    return (
        <li className="rounded-xl border border-foreground/10 bg-card p-4 md:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold tracking-[0.1em] text-foreground/60 uppercase">{REVIEW_TYPE_LABEL[item.type]}</h2>
                <span className="text-xs text-foreground/50">{timeAgo(item.createdAt)}</span>
            </div>
            {item.reason && <p className="mt-1 text-sm text-foreground/70">{item.reason}</p>}

            <div className={cn("mt-4 grid gap-3", pair && "md:grid-cols-2")}>
                <AuthorProfileCard author={author} label={pair ? "A" : undefined} />
                {pair && otherAuthor && <AuthorProfileCard author={otherAuthor} label="B" />}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {pair && otherAuthor ? (
                    <>
                        <Button
                            variant="outline"
                            className={outlineButton}
                            disabled={busy}
                            onClick={() => onMerge({ from: author, into: otherAuthor })}
                        >
                            Merge A into B
                        </Button>
                        <Button
                            variant="outline"
                            className={outlineButton}
                            disabled={busy}
                            onClick={() => onMerge({ from: otherAuthor, into: author })}
                        >
                            Merge B into A
                        </Button>
                        <Button
                            className={cn(outlineButton, "bg-olive text-white hover:bg-olive/90")}
                            disabled={busy}
                            onClick={() => keepSeparate.mutate({ itemId: item.id })}
                        >
                            {keepSeparate.isPending ? "Saving…" : "Different people: keep both"}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            className={cn(outlineButton, "bg-olive text-white hover:bg-olive/90")}
                            disabled={busy || author.status === "VERIFIED"}
                            onClick={() => verify.mutate(author.id)}
                        >
                            {verify.isPending ? "Verifying…" : "Looks right: verify"}
                        </Button>
                        <Button variant="outline" className={outlineButton} disabled={busy} onClick={() => onMerge({ from: author, into: null })}>
                            Merge into…
                        </Button>
                        <Button variant="ghost" className={cn(outlineButton, "text-destructive hover:text-destructive")} disabled={busy} onClick={() => onDelete(item)}>
                            Delete
                        </Button>
                    </>
                )}
            </div>
        </li>
    );
};

/** /admin/authors/review: sellers' new authors and possible duplicates, oldest first (API_CHANGES #23f). */
const ReviewQueuePage = () => {
    const [params, setParams] = useSearchParams();
    const typeParam = params.get("type");
    const type = isType(typeParam) ? typeParam : undefined;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const [merge, setMerge] = useState<MergeTarget | null>(null);
    const [deleting, setDeleting] = useState<IAuthorReviewItem | null>(null);
    const { remove } = useAdminAuthorActions();

    useEffect(() => {
        document.title = "Review queue · Admin · Rebooked";
    }, []);

    const reviewQuery = useQuery({
        queryKey: ["admin-review", { type, page }],
        queryFn: () => adminAuthorService.reviewItems({ type, page: page - 1 }),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
    });
    const data = reviewQuery.data;

    const setParam = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(params);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if (!("page" in changes)) next.delete("page");
        setParams(next, { replace: true });
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-serif text-4xl">Review queue</h1>
                <p className="mt-1 text-foreground/60">
                    Nothing is merged on a name alone. Two people can share a name, so check the dates, works and links.
                </p>
            </div>

            <div role="tablist" aria-label="Kind" className="-mx-1 flex gap-1 overflow-x-auto px-1">
                {TYPE_TABS.map((tab) => {
                    const selected = tab.key === type;
                    return (
                        <button
                            key={tab.label}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setParam({ type: tab.key })}
                            className={cn(
                                "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                                selected ? "bg-[#4a2d18] font-semibold text-[#f6efe1]" : "bg-secondary hover:bg-secondary/70",
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {reviewQuery.isError ? (
                <EmptyState
                    title="We couldn't load the queue"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => reviewQuery.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : reviewQuery.isLoading ? (
                <div aria-busy className="space-y-3">
                    {Array.from({ length: 3 }, (_, index) => (
                        <div key={index} className="h-48 animate-pulse rounded-xl bg-secondary" />
                    ))}
                </div>
            ) : !data?.content.length ? (
                <EmptyState title="Nothing to review" description="New authors from sellers and possible duplicates show up here." />
            ) : (
                <>
                    <p className="text-sm text-foreground/60" aria-live="polite">
                        {data.totalElements.toLocaleString()} open {data.totalElements === 1 ? "item" : "items"}
                    </p>
                    <ul className={cn("space-y-4", reviewQuery.isPlaceholderData && "opacity-60")}>
                        {data.content.map((item) => (
                            <ReviewCard key={item.id} item={item} onMerge={setMerge} onDelete={setDeleting} />
                        ))}
                    </ul>
                    <Pagination page={page} totalPages={data.totalPages} onChange={(next) => setParam({ page: next > 1 ? String(next) : undefined })} />
                </>
            )}

            {merge && (
                <MergeAuthorsDialog
                    open={!!merge}
                    onOpenChange={(open) => !open && setMerge(null)}
                    from={merge.from}
                    into={merge.into}
                />
            )}

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={`Delete ${deleting?.author.name ?? "this author"}?`}
                description="Only possible when no book uses this author. If one does, merge it into the right author instead."
                confirmLabel="Delete author"
                pendingLabel="Deleting…"
                tone="destructive"
                pending={remove.isPending}
                onConfirm={() => deleting && remove.mutate(deleting.author.id, { onSettled: () => setDeleting(null) })}
            />
        </div>
    );
};

export default ReviewQueuePage;
