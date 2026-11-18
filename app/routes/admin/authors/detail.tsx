import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { AuthorStatusPill } from "~/components/admin/AuthorProfileCard";
import MergeAuthorsDialog from "~/components/admin/MergeAuthorsDialog";
import Pagination from "~/components/shop/Pagination";
import { Button } from "~/components/ui/button";
import ConfirmDialog from "~/components/ui/confirm-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAdminAuthorActions, useInvalidateAuthors } from "~/hooks/useAdminAuthors";
import { cn } from "~/lib/utils";
import adminAuthorService from "~/services/admin-author.service";
import type { AuthorSource, IAdminAuthor, IAdminAuthorUpdate, IAuthorExternalId } from "~/types/author";
import {
    AUDIT_ACTION_LABEL,
    AUTHOR_ORIGIN_LABEL,
    AUTHOR_SOURCE_LABEL,
    FIELD_SOURCE_LABEL,
    REVIEW_TYPE_LABEL,
    formatDateTime,
} from "~/utils/adminAuthor";
import { aliasNames, authorPath } from "~/utils/author";
import { STATUS_LABEL, STATUS_PILL, bookPath } from "~/utils/book";
import { getErrorMessage, getErrorStatus, getFieldErrors } from "~/utils/https";
import { displayName } from "~/utils/text";
import NotFoundMessage from "~/components/shop/NotFoundMessage";

const LIMITS = { name: 120, description: 160, biography: 3000, aliases: 30 };
const CURRENT_YEAR = new Date().getFullYear();

interface EditValues {
    name: string;
    /** One per line. */
    aliases: string;
    description: string;
    biography: string;
    birthYear: string;
    deathYear: string;
}

const toValues = (author: IAdminAuthor): EditValues => ({
    name: author.name ?? "",
    aliases: aliasNames(author.aliases).join("\n"),
    description: author.description ?? "",
    biography: author.biography ?? "",
    birthYear: author.birthYear ? String(author.birthYear) : "",
    deathYear: author.deathYear ? String(author.deathYear) : "",
});

const parseAliases = (text: string) => [...new Set(text.split("\n").map((line) => line.trim()).filter(Boolean))];
const parseYear = (text: string) => (text.trim() ? Number(text) : null);

const validate = (values: EditValues) => {
    const errors: Partial<Record<keyof EditValues, string>> = {};
    const name = values.name.trim();
    if (name.length < 2) errors.name = "A name needs at least 2 characters";
    else if (name.length > LIMITS.name) errors.name = `Keep it under ${LIMITS.name} characters`;
    if (parseAliases(values.aliases).length > LIMITS.aliases) errors.aliases = `Up to ${LIMITS.aliases} other names`;
    if (values.description.length > LIMITS.description) errors.description = `Keep it under ${LIMITS.description} characters`;
    if (values.biography.length > LIMITS.biography) errors.biography = `Keep it under ${LIMITS.biography} characters`;
    const birth = parseYear(values.birthYear);
    const death = parseYear(values.deathYear);
    if (birth !== null && !(Number.isInteger(birth) && birth > 0 && birth <= CURRENT_YEAR)) errors.birthYear = "Enter a year";
    if (death !== null && !(Number.isInteger(death) && death > 0 && death <= CURRENT_YEAR)) errors.deathYear = "Enter a year";
    if (birth && death && death < birth) errors.deathYear = "Can't be before the birth year";
    return errors;
};

/** Only what changed, so untouched fields keep their source (and stay importable). */
const diff = (values: EditValues, author: IAdminAuthor): IAdminAuthorUpdate => {
    const initial = toValues(author);
    const changes: IAdminAuthorUpdate = {};
    if (values.name.trim() !== initial.name) changes.name = values.name.trim();
    if (parseAliases(values.aliases).join("\n") !== parseAliases(initial.aliases).join("\n")) changes.aliases = parseAliases(values.aliases);
    if (values.description.trim() !== initial.description) changes.description = values.description.trim();
    if (values.biography.trim() !== initial.biography) changes.biography = values.biography.trim();
    if (values.birthYear.trim() !== initial.birthYear) changes.birthYear = parseYear(values.birthYear);
    if (values.deathYear.trim() !== initial.deathYear) changes.deathYear = parseYear(values.deathYear);
    return changes;
};

const Section = ({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) => (
    <section className="rounded-xl border border-foreground/10 bg-card p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl">{title}</h2>
            {aside}
        </div>
        {children}
    </section>
);

const EditField = ({
    label,
    htmlFor,
    source,
    error,
    hint,
    children,
}: {
    label: string;
    htmlFor: string;
    source?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}) => (
    <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {source && <span className="text-xs text-foreground/50">{source}</span>}
        </div>
        {children}
        {error ? <span className="text-sm text-destructive">{error}</span> : hint ? <span className="text-sm text-foreground/50">{hint}</span> : null}
    </div>
);

const textareaClass =
    "w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

const EditForm = ({ author }: { author: IAdminAuthor }) => {
    const invalidate = useInvalidateAuthors();
    const initial = useMemo(() => toValues(author), [author]);
    const [values, setValues] = useState(initial);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    useEffect(() => setValues(initial), [initial]);

    const changes = diff(values, author);
    const dirty = Object.keys(changes).length > 0;
    const errors = { ...validate(values), ...serverErrors };
    const sourceOf = (field: string) => {
        const source = author.fieldSources?.[field];
        return source ? FIELD_SOURCE_LABEL[source] : undefined;
    };
    const set = (key: keyof EditValues, value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
        if (serverErrors[key]) setServerErrors(({ [key]: _removed, ...rest }) => rest);
    };

    const saveMutation = useMutation({
        mutationFn: () => adminAuthorService.update(author.id, changes),
        onSuccess: () => {
            toast.success("Saved. Imports won't overwrite these fields.");
            void invalidate();
        },
        onError: (error) => {
            setServerErrors(getFieldErrors(error));
            toast.error(getErrorMessage(error, "Couldn't save those changes."));
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (dirty && Object.keys(validate(values)).length === 0) saveMutation.mutate();
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <EditField label="Name" htmlFor="author-name" source={sourceOf("name")} error={errors.name} hint="Renaming updates every book that lists this author.">
                <Input id="author-name" value={values.name} onChange={(event) => set("name", event.target.value)} maxLength={LIMITS.name} aria-invalid={!!errors.name} />
            </EditField>
            <EditField
                label="Other names"
                htmlFor="author-aliases"
                source={sourceOf("aliases")}
                error={errors.aliases}
                hint="One per line: pen names, spellings, names in other scripts. Search finds these too."
            >
                <textarea
                    id="author-aliases"
                    rows={3}
                    value={values.aliases}
                    onChange={(event) => set("aliases", event.target.value)}
                    aria-invalid={!!errors.aliases}
                    className={textareaClass}
                />
            </EditField>
            <EditField
                label="Short description"
                htmlFor="author-description"
                source={sourceOf("description")}
                error={errors.description}
                hint="Tells same-name authors apart in the seller's picker, e.g. “Nigerian novelist”."
            >
                <Input
                    id="author-description"
                    value={values.description}
                    onChange={(event) => set("description", event.target.value)}
                    maxLength={LIMITS.description}
                    aria-invalid={!!errors.description}
                />
            </EditField>
            <div className="grid gap-5 sm:grid-cols-2">
                <EditField label="Born" htmlFor="author-born" source={sourceOf("birthYear")} error={errors.birthYear}>
                    <Input
                        id="author-born"
                        inputMode="numeric"
                        value={values.birthYear}
                        onChange={(event) => set("birthYear", event.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="1930"
                        aria-invalid={!!errors.birthYear}
                    />
                </EditField>
                <EditField label="Died" htmlFor="author-died" source={sourceOf("deathYear")} error={errors.deathYear}>
                    <Input
                        id="author-died"
                        inputMode="numeric"
                        value={values.deathYear}
                        onChange={(event) => set("deathYear", event.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="Leave empty if living"
                        aria-invalid={!!errors.deathYear}
                    />
                </EditField>
            </div>
            <EditField
                label="Biography"
                htmlFor="author-bio"
                source={sourceOf("biography")}
                error={errors.biography}
                hint="Plain text. Bios you write always show on the author page."
            >
                <textarea
                    id="author-bio"
                    rows={6}
                    value={values.biography}
                    onChange={(event) => set("biography", event.target.value)}
                    maxLength={LIMITS.biography}
                    aria-invalid={!!errors.biography}
                    className={textareaClass}
                />
            </EditField>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" disabled={!dirty || saveMutation.isPending} onClick={() => setValues(initial)} className="h-11 rounded-md px-4">
                    Undo changes
                </Button>
                <Button
                    type="submit"
                    disabled={!dirty || saveMutation.isPending || Object.keys(validate(values)).length > 0}
                    className="h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    {saveMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </form>
    );
};

const ExternalIds = ({ author }: { author: IAdminAuthor }) => {
    const invalidate = useInvalidateAuthors();
    const [source, setSource] = useState<AuthorSource>("OPEN_LIBRARY");
    const [sourceId, setSourceId] = useState("");
    const [error, setError] = useState<string>();
    const [removing, setRemoving] = useState<IAuthorExternalId | null>(null);

    const addMutation = useMutation({
        mutationFn: () => adminAuthorService.addExternalId(author.id, source, sourceId.trim()),
        onSuccess: () => {
            setSourceId("");
            toast.success("Linked");
            void invalidate();
        },
        onError: (err) => setError(getFieldErrors(err).sourceId ?? getErrorMessage(err, "Couldn't link that record.")),
    });
    const removeMutation = useMutation({
        mutationFn: (externalId: IAuthorExternalId) => adminAuthorService.removeExternalId(author.id, externalId.source, externalId.sourceId),
        onSuccess: () => {
            toast.success("Unlinked");
            void invalidate();
        },
        onError: (err) => toast.error(getErrorMessage(err, "Couldn't unlink that record.")),
        onSettled: () => setRemoving(null),
    });
    const externalIds = author.externalIds ?? [];

    return (
        <>
            {externalIds.length === 0 ? (
                <p className="text-sm text-foreground/60">Not linked to any outside catalogue.</p>
            ) : (
                <ul className="divide-y divide-foreground/10">
                    {externalIds.map((externalId) => (
                        <li key={`${externalId.source}:${externalId.sourceId}`} className="flex items-center justify-between gap-3 py-2.5">
                            <span className="min-w-0 text-sm">
                                <span className="font-semibold">{AUTHOR_SOURCE_LABEL[externalId.source]}</span>{" "}
                                {externalId.url ? (
                                    <a href={externalId.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                        {externalId.sourceId}
                                        <ExternalLink className="size-3.5" aria-hidden />
                                    </a>
                                ) : (
                                    externalId.sourceId
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => setRemoving(externalId)}
                                aria-label={`Unlink ${AUTHOR_SOURCE_LABEL[externalId.source]} ${externalId.sourceId}`}
                                className="rounded-md p-1.5 text-foreground/50 hover:bg-secondary hover:text-destructive"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    if (sourceId.trim()) addMutation.mutate();
                }}
                className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start"
            >
                <select
                    value={source}
                    onChange={(event) => setSource(event.target.value as AuthorSource)}
                    aria-label="Catalogue"
                    className="h-10 rounded-lg border border-input bg-transparent px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    {(Object.keys(AUTHOR_SOURCE_LABEL) as AuthorSource[]).map((key) => (
                        <option key={key} value={key}>
                            {AUTHOR_SOURCE_LABEL[key]}
                        </option>
                    ))}
                </select>
                <div className="flex flex-1 flex-col gap-1">
                    <Input
                        value={sourceId}
                        onChange={(event) => {
                            setSourceId(event.target.value);
                            setError(undefined);
                        }}
                        placeholder={source === "OPEN_LIBRARY" ? "OL23919A" : source === "WIKIDATA" ? "Q42" : "Identifier"}
                        aria-label="Identifier"
                        aria-invalid={!!error}
                        className="h-10"
                    />
                    {error && <span className="text-sm text-destructive">{error}</span>}
                </div>
                <Button type="submit" variant="outline" disabled={!sourceId.trim() || addMutation.isPending} className="h-10 rounded-md px-4 font-semibold">
                    {addMutation.isPending ? "Linking…" : "Link"}
                </Button>
            </form>
            <ConfirmDialog
                open={!!removing}
                onOpenChange={(open) => !open && setRemoving(null)}
                title="Unlink this record?"
                description="The next import may treat that catalogue record as a different author."
                confirmLabel="Unlink"
                pendingLabel="Unlinking…"
                tone="destructive"
                pending={removeMutation.isPending}
                onConfirm={() => removing && removeMutation.mutate(removing)}
            />
        </>
    );
};

const LinkedBooks = ({ authorId }: { authorId: string }) => {
    const [page, setPage] = useState(1);
    const booksQuery = useQuery({
        queryKey: ["admin-author-books", authorId, page],
        queryFn: () => adminAuthorService.books(authorId, page - 1),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
    });
    const data = booksQuery.data;
    if (booksQuery.isLoading) return <div aria-busy className="h-24 animate-pulse rounded-lg bg-secondary" />;
    if (booksQuery.isError) return <p className="text-sm text-destructive">Couldn't load the books.</p>;
    if (!data?.content.length) return <p className="text-sm text-foreground/60">No books list this author.</p>;
    return (
        <>
            <ul className={cn("divide-y divide-foreground/10", booksQuery.isPlaceholderData && "opacity-60")}>
                {data.content.map((book) => (
                    <li key={book.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                            {book.status === "DRAFT" ? (
                                <span className="block truncate">{book.title}</span>
                            ) : (
                                <Link to={bookPath(book)} className="block truncate hover:underline">
                                    {book.title}
                                </Link>
                            )}
                            <span className="block truncate text-xs text-foreground/55">{displayName(book.seller?.userName) || "Unknown seller"}</span>
                        </span>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_PILL[book.status])}>{STATUS_LABEL[book.status]}</span>
                    </li>
                ))}
            </ul>
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
    );
};

const AuditTrail = ({ authorId }: { authorId: string }) => {
    const [page, setPage] = useState(1);
    const auditQuery = useQuery({
        queryKey: ["admin-author-audit", authorId, page],
        queryFn: () => adminAuthorService.audit(authorId, page - 1),
        select: (response) => response.data,
        placeholderData: keepPreviousData,
    });
    const data = auditQuery.data;
    if (auditQuery.isLoading) return <div aria-busy className="h-24 animate-pulse rounded-lg bg-secondary" />;
    if (auditQuery.isError) return <p className="text-sm text-destructive">Couldn't load the history.</p>;
    if (!data?.content.length) return <p className="text-sm text-foreground/60">No changes recorded yet.</p>;
    return (
        <>
            <ol className="space-y-3">
                {data.content.map((entry) => {
                    const fields = Object.keys(entry.after ?? entry.before ?? {});
                    return (
                        <li key={entry.id} className="border-l-2 border-foreground/15 pl-3 text-sm">
                            <div>
                                <span className="font-semibold">{AUDIT_ACTION_LABEL[entry.action] ?? entry.action}</span>
                                {fields.length > 0 && entry.action === "UPDATED" && <span className="text-foreground/65">: {fields.join(", ")}</span>}
                            </div>
                            <div className="text-xs text-foreground/55">
                                {displayName(entry.actor?.userName) || "System"} · {formatDateTime(entry.createdAt)}
                            </div>
                            {entry.reason && <p className="mt-1 text-foreground/70">“{entry.reason}”</p>}
                        </li>
                    );
                })}
            </ol>
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
    );
};

/** /admin/authors/:id: edit, verify, link, merge or delete one author, with its books and history. */
const AdminAuthorPage = () => {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { verify, remove } = useAdminAuthorActions();
    const [mergeOpen, setMergeOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const authorQuery = useQuery({
        queryKey: ["admin-author", id],
        queryFn: () => adminAuthorService.get(id),
        select: (response) => response.data,
        retry: (count, error) => getErrorStatus(error) !== 404 && count < 2,
    });
    const author = authorQuery.data;

    useEffect(() => {
        if (author) document.title = `${author.name} · Admin · Rebooked`;
    }, [author]);

    if (authorQuery.isLoading) return <div aria-busy className="h-64 animate-pulse rounded-xl bg-secondary" />;
    if (!author) {
        return (
            <NotFoundMessage
                title={getErrorStatus(authorQuery.error) === 404 ? "Author not found" : "We couldn't load this author"}
                description="It may have been deleted. Search the catalogue instead."
                to="/admin/authors"
                cta="All authors"
            />
        );
    }

    const merged = author.status === "MERGED";
    const facts = [AUTHOR_ORIGIN_LABEL[author.origin], `${(author.availableCount ?? 0).toLocaleString()} available`, author.soldCount ? `${author.soldCount} sold` : "", author.workCount ? `${author.workCount}${author.workCount >= 127 ? "+" : ""} works in Open Library` : ""].filter(Boolean);

    return (
        <div className="flex flex-col gap-6">
            <Link to="/admin/authors" className="inline-flex w-fit items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden />
                All authors
            </Link>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="font-serif text-4xl break-words">{author.name}</h1>
                        <AuthorStatusPill status={author.status} />
                    </div>
                    <p className="mt-1 text-foreground/60">{facts.join(" · ")}</p>
                    {author.createdBy && (
                        <p className="mt-0.5 text-sm text-foreground/55">
                            Added by {displayName(author.createdBy.userName) || "a seller"} on {formatDateTime(author.createdAt)}
                        </p>
                    )}
                </div>
                {!merged && (
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="h-10 rounded-md px-3.5 font-semibold">
                            <Link to={authorPath(author)}>Public page</Link>
                        </Button>
                        {author.status !== "VERIFIED" && (
                            <Button
                                onClick={() => verify.mutate(author.id)}
                                disabled={verify.isPending}
                                className="h-10 rounded-md bg-olive px-3.5 font-semibold text-white hover:bg-olive/90"
                            >
                                {verify.isPending ? "Verifying…" : "Verify"}
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setMergeOpen(true)} className="h-10 rounded-md px-3.5 font-semibold">
                            Merge into…
                        </Button>
                        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="h-10 rounded-md px-3.5 font-semibold text-destructive hover:text-destructive">
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {merged && (
                <div className="rounded-lg border border-foreground/10 bg-secondary px-4 py-3 text-sm">
                    This author was merged.{" "}
                    {author.mergedIntoAuthorId && (
                        <Link to={`/admin/authors/${author.mergedIntoAuthorId}`} className="font-semibold text-primary hover:underline">
                            Go to the author it was merged into
                        </Link>
                    )}
                </div>
            )}

            {!!author.openReviewItems?.length && (
                <div className="rounded-lg border border-[#c4513f]/25 bg-[#c4513f]/6 px-4 py-3 text-sm">
                    <p className="font-semibold">Waiting for review</p>
                    <ul className="mt-1 list-disc pl-5 text-foreground/75">
                        {author.openReviewItems.map((item) => (
                            <li key={item.id}>
                                {REVIEW_TYPE_LABEL[item.type]}
                                {item.otherAuthor && (
                                    <>
                                        {" "}
                                        with{" "}
                                        <Link to={`/admin/authors/${item.otherAuthor.id}`} className="font-semibold hover:underline">
                                            {item.otherAuthor.name}
                                        </Link>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                    <Link to="/admin/authors/review" className="mt-1 inline-block font-semibold text-primary hover:underline">
                        Open the review queue
                    </Link>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="flex min-w-0 flex-col gap-6">
                    <Section title="Details">{merged ? <p className="text-sm text-foreground/60">Merged authors can't be edited.</p> : <EditForm author={author} />}</Section>
                    <Section title="Books">
                        <LinkedBooks authorId={author.id} />
                    </Section>
                </div>
                <div className="flex min-w-0 flex-col gap-6">
                    <Section title="Catalogue links">
                        <ExternalIds author={author} />
                    </Section>
                    <Section title="History">
                        <AuditTrail authorId={author.id} />
                    </Section>
                </div>
            </div>

            <MergeAuthorsDialog
                open={mergeOpen}
                onOpenChange={setMergeOpen}
                from={author}
                onMerged={(survivor) => navigate(`/admin/authors/${survivor.id}`)}
            />
            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={`Delete ${author.name}?`}
                description="Only possible when no book uses this author. If one does, merge it into the right author instead."
                confirmLabel="Delete author"
                pendingLabel="Deleting…"
                tone="destructive"
                pending={remove.isPending}
                onConfirm={() =>
                    remove.mutate(author.id, {
                        onSuccess: () => navigate("/admin/authors"),
                        onSettled: () => setDeleteOpen(false),
                    })
                }
            />
        </div>
    );
};

export default AdminAuthorPage;
