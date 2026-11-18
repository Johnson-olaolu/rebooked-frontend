import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import type { AuthorOrigin, AuthorStatus, IAuthorExternalId, IAuthorSummary } from "~/types/author";
import { AUTHOR_ORIGIN_LABEL, AUTHOR_SOURCE_LABEL, AUTHOR_STATUS_LABEL, AUTHOR_STATUS_PILL } from "~/utils/adminAuthor";
import { aliasNames, authorYears } from "~/utils/author";

export const AuthorStatusPill = ({ status, className }: { status: AuthorStatus; className?: string }) => (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", AUTHOR_STATUS_PILL[status], className)}>
        {AUTHOR_STATUS_LABEL[status]}
    </span>
);

export type AuthorProfileLike = IAuthorSummary & {
    origin?: AuthorOrigin;
    status?: AuthorStatus;
    soldCount?: number;
    /** Books in any status (merge preview). */
    bookCount?: number;
    externalIds?: IAuthorExternalId[];
    aliases?: (string | { name: string })[];
};

/** One author's facts for side-by-side comparison: review queue and merge preview. */
const AuthorProfileCard = ({ author, label, className }: { author: AuthorProfileLike; label?: ReactNode; className?: string }) => {
    const years = authorYears(author);
    const aliases = aliasNames(author.aliases);
    const counts = [
        author.bookCount !== undefined ? `${author.bookCount.toLocaleString()} ${author.bookCount === 1 ? "book" : "books"}` : "",
        `${(author.availableCount ?? 0).toLocaleString()} available`,
        author.soldCount ? `${author.soldCount.toLocaleString()} sold` : "",
    ].filter(Boolean);

    return (
        <div className={cn("min-w-0 rounded-lg border border-foreground/12 bg-card p-4", className)}>
            {label && <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-foreground/50 uppercase">{label}</div>}
            <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/authors/${author.id}`} className="font-serif text-xl break-words hover:underline">
                    {author.name}
                </Link>
                {author.status && <AuthorStatusPill status={author.status} />}
            </div>
            <dl className="mt-2 space-y-1 text-sm text-foreground/70">
                {(years || author.description) && <dd>{[years, author.description].filter(Boolean).join(" · ")}</dd>}
                {author.origin && <dd>{AUTHOR_ORIGIN_LABEL[author.origin]}</dd>}
                <dd>{counts.join(" · ")}</dd>
                {aliases.length > 0 && <dd>Also known as {aliases.join(", ")}</dd>}
            </dl>
            {!!author.externalIds?.length && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                    {author.externalIds.map((externalId) => (
                        <li key={`${externalId.source}:${externalId.sourceId}`}>
                            {externalId.url ? (
                                <a
                                    href={externalId.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs hover:underline"
                                >
                                    {AUTHOR_SOURCE_LABEL[externalId.source]} {externalId.sourceId}
                                    <ExternalLink className="size-3" aria-hidden />
                                </a>
                            ) : (
                                <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                                    {AUTHOR_SOURCE_LABEL[externalId.source]} {externalId.sourceId}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AuthorProfileCard;
