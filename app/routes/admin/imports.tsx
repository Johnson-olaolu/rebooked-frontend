import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Pagination from "~/components/shop/Pagination";
import { Button } from "~/components/ui/button";
import { useInvalidateAuthors } from "~/hooks/useAdminAuthors";
import { cn } from "~/lib/utils";
import adminAuthorService from "~/services/admin-author.service";
import type { IAuthorImportJob, ImportSource } from "~/types/author";
import { IMPORT_STATUS_PILL, formatDateTime } from "~/utils/adminAuthor";
import { getErrorMessage } from "~/utils/https";
import EmptyState from "~/routes/dashboard/components/EmptyState";

const SOURCE_LABEL: Record<ImportSource, string> = { OPEN_LIBRARY: "Open Library import", WIKIDATA: "Wikidata enrichment" };
const STATUS_TEXT: Record<IAuthorImportJob["status"], string> = {
    PENDING: "Waiting",
    RUNNING: "Running",
    COMPLETED: "Done",
    FAILED: "Failed",
};

const count = (value?: number) => (value ?? 0).toLocaleString();

/** Paged errors for one job, in a sheet (bottom on phones, right on desktop). */
const ErrorsSheet = ({ job, onClose }: { job: IAuthorImportJob | null; onClose: () => void }) => {
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [job?.id]);
    const errorsQuery = useQuery({
        queryKey: ["admin-import-errors", job?.id, page],
        queryFn: () => adminAuthorService.importErrors(job!.id, page - 1),
        select: (response) => response.data,
        enabled: !!job,
        placeholderData: keepPreviousData,
    });
    const data = errorsQuery.data;

    return (
        <DialogPrimitive.Root open={!!job} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#241b12]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-[0_-12px_40px_rgba(36,27,18,0.2)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:max-w-lg md:rounded-none md:data-[state=open]:slide-in-from-right">
                    <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="font-serif text-2xl">Import errors</DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-0.5 text-sm text-foreground/60">
                                {job ? `${SOURCE_LABEL[job.source]} · ${job.datasetVersion ?? "no version"}` : ""}
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close aria-label="Close" className="rounded-md p-1.5 hover:bg-secondary">
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {errorsQuery.isLoading ? (
                            <div aria-busy className="h-24 animate-pulse rounded-lg bg-secondary" />
                        ) : errorsQuery.isError ? (
                            <p className="text-sm text-destructive">Couldn't load the errors.</p>
                        ) : !data?.content.length ? (
                            <p className="text-sm text-foreground/60">No errors recorded (they're kept for 90 days).</p>
                        ) : (
                            <>
                                <ul className={cn("divide-y divide-foreground/10", errorsQuery.isPlaceholderData && "opacity-60")}>
                                    {data.content.map((error, index) => (
                                        <li key={`${error.line}-${index}`} className="py-2.5 text-sm">
                                            <div className="text-xs text-foreground/55">
                                                {[error.line != null && `Line ${error.line.toLocaleString()}`, error.sourceId].filter(Boolean).join(" · ")}
                                            </div>
                                            <p className="mt-0.5 break-words">{error.message}</p>
                                        </li>
                                    ))}
                                </ul>
                                <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
                            </>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

/** /admin/imports: Open Library seed and Wikidata enrichment runs (API_CHANGES #23g–h). */
const ImportsPage = () => {
    const [page, setPage] = useState(1);
    const [errorsFor, setErrorsFor] = useState<IAuthorImportJob | null>(null);
    const invalidate = useInvalidateAuthors();

    useEffect(() => {
        document.title = "Imports · Admin · Rebooked";
    }, []);

    const jobsQuery = useQuery({
        queryKey: ["admin-imports", page],
        queryFn: () => adminAuthorService.imports(page - 1),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
        // Poll while something is running.
        refetchInterval: (query) =>
            query.state.data?.data?.content.some((job) => job.status === "RUNNING" || job.status === "PENDING") ? 10_000 : false,
    });
    const data = jobsQuery.data;
    const running = data?.content.some((job) => job.status === "RUNNING" || job.status === "PENDING") ?? false;

    const startMutation = useMutation({
        mutationFn: (source: ImportSource) => adminAuthorService.startImport(source),
        onSuccess: (_response, source) => {
            toast.success(`${SOURCE_LABEL[source]} started`);
            void jobsQuery.refetch();
            void invalidate();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't start the import.")),
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-4xl">Imports</h1>
                    <p className="mt-1 max-w-2xl text-foreground/60">
                        The monthly job checks Open Library for a new dump and imports only what changed. Admin edits are never
                        overwritten.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => startMutation.mutate("WIKIDATA")}
                        disabled={running || startMutation.isPending}
                        className="h-11 rounded-md px-4 font-semibold"
                    >
                        Run Wikidata enrichment
                    </Button>
                    <Button
                        onClick={() => startMutation.mutate("OPEN_LIBRARY")}
                        disabled={running || startMutation.isPending}
                        className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Run Open Library import
                    </Button>
                </div>
            </div>
            {running && (
                <p className="text-sm text-foreground/60" aria-live="polite">
                    An import is running. This page refreshes every 10 seconds.
                </p>
            )}

            {jobsQuery.isError ? (
                <EmptyState
                    title="We couldn't load imports"
                    description="Check your connection and try again."
                    action={
                        <Button variant="outline" onClick={() => jobsQuery.refetch()} className="h-11 rounded-md px-5 font-semibold">
                            Try again
                        </Button>
                    }
                />
            ) : jobsQuery.isLoading ? (
                <div aria-busy className="space-y-3">
                    {Array.from({ length: 3 }, (_, index) => (
                        <div key={index} className="h-32 animate-pulse rounded-xl bg-secondary" />
                    ))}
                </div>
            ) : !data?.content.length ? (
                <EmptyState title="No imports yet" description="Run the Open Library import to seed the catalogue." />
            ) : (
                <>
                    <ul className="space-y-3">
                        {data.content.map((job) => {
                            const stats: [string, number | undefined][] = [
                                ["Read", job.recordsRead],
                                ["Created", job.recordsCreated],
                                ["Updated", job.recordsUpdated],
                                ["Skipped", job.recordsSkipped],
                                ["To review", job.recordsNeedingReview],
                                ["Failed", job.recordsFailed],
                            ];
                            return (
                                <li key={job.id} className="rounded-xl border border-foreground/10 bg-card p-4 md:p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-serif text-xl">{SOURCE_LABEL[job.source]}</h2>
                                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", IMPORT_STATUS_PILL[job.status])}>
                                                {STATUS_TEXT[job.status]}
                                            </span>
                                        </div>
                                        <span className="text-sm text-foreground/55">{job.datasetVersion ? `Dataset ${job.datasetVersion}` : ""}</span>
                                    </div>
                                    <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
                                        {stats.map(([label, value]) => (
                                            <div key={label}>
                                                <dt className="text-xs text-foreground/55">{label}</dt>
                                                <dd className="font-semibold tabular-nums">{count(value)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    {job.coverage && (
                                        <p className="mt-3 text-sm text-foreground/70">
                                            Coverage: {count(job.coverage.NG)} Nigerian authors · {count(job.coverage.africa)} African authors
                                        </p>
                                    )}
                                    {job.errorSummary && <p className="mt-2 text-sm text-destructive">{job.errorSummary}</p>}
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/55">
                                        <span>
                                            Started {formatDateTime(job.startedAt)}
                                            {job.completedAt && ` · finished ${formatDateTime(job.completedAt)}`}
                                        </span>
                                        {!!job.recordsFailed && (
                                            <button type="button" onClick={() => setErrorsFor(job)} className="text-sm font-semibold text-primary hover:underline">
                                                See errors
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
                </>
            )}

            <ErrorsSheet job={errorsFor} onClose={() => setErrorsFor(null)} />
        </div>
    );
};

export default ImportsPage;
