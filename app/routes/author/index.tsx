import { useQuery } from "@tanstack/react-query";
import type { Route } from "./+types/index";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, redirect, useParams } from "react-router";
import Breadcrumb from "~/components/shop/Breadcrumb";
import NotFoundMessage from "~/components/shop/NotFoundMessage";
import ShopBrowser from "~/components/shop/ShopBrowser";
import { Button } from "~/components/ui/button";
import authorService from "~/services/author.service";
import type { IAuthorDetail } from "~/types/author";
import { authorYears } from "~/utils/author";
import { pageMeta, SITE_NAME, canonicalUrl } from "~/utils/seo";
import { getErrorStatus } from "~/utils/https";

const SOURCE_NAMES = { OPEN_LIBRARY: "Open Library", WIKIDATA: "Wikidata" } as const;

/** Bio (clamped until "Read more"), other names, outside links and where the details came from. */
const AuthorIntro = ({ author }: { author: IAuthorDetail }) => {
    const [expanded, setExpanded] = useState(false);
    const bio = author.biography?.trim();
    const aliases = (author.aliases ?? []).filter((alias) => alias && alias !== author.name);
    const links = [
        author.links?.wikipedia && { label: "Wikipedia", href: author.links.wikipedia },
        author.links?.openLibrary && { label: "Open Library", href: author.links.openLibrary },
    ].filter((link): link is { label: string; href: string } => !!link);
    const sources = (author.attribution ?? []).map((source) => SOURCE_NAMES[source]).filter(Boolean);

    if (!bio && !aliases.length && !links.length && !sources.length && author.verified) return null;

    return (
        <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-foreground/75">
            {bio && (
                <div>
                    <p className={expanded ? "whitespace-pre-line" : "line-clamp-4 whitespace-pre-line"}>{bio}</p>
                    {bio.length > 320 && (
                        <button
                            type="button"
                            onClick={() => setExpanded((value) => !value)}
                            className="mt-1 text-sm font-semibold text-primary hover:underline"
                        >
                            {expanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </div>
            )}
            {aliases.length > 0 && <p className="text-sm text-foreground/60">Also known as {aliases.join(", ")}</p>}
            {!author.verified && (
                <p className="text-sm text-foreground/55">A seller added this author. We haven't checked the details yet.</p>
            )}
            {links.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                            {link.label}
                            <ExternalLink className="size-3.5" aria-hidden />
                            <span className="sr-only">(opens in a new tab)</span>
                        </a>
                    ))}
                </div>
            )}
            {sources.length > 0 && <p className="text-xs text-foreground/45">Some details from {sources.join(" and ")}.</p>}
        </div>
    );
};

/**
 * Author pages are public, so they're fetched server-side: crawlers get the name, bio and
 * book list in the HTML. A merged author answers under its canonical slug, which we turn
 * into a real 301 here so search engines fold the old URL into the new one instead of
 * indexing both.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
    const url = canonicalUrl(request);
    try {
        const response = await authorService.getBySlug(params.slug);
        if (response.data && response.data.slug !== params.slug) {
            throw redirect(`/author/${response.data.slug}`, 301);
        }
        return { author: response, url };
    } catch (error) {
        if (error instanceof Response) throw error;
        return { author: null, url };
    }
}

export function meta({ data: loaded }: Route.MetaArgs) {
    const author = loaded?.author?.data;
    if (!author) {
        return pageMeta({ title: `Author · ${SITE_NAME}`, url: loaded?.url, noIndex: true });
    }

    const years = authorYears(author);
    const count = author.availableCount
        ? `${author.availableCount.toLocaleString()} second-hand ${author.availableCount === 1 ? "book" : "books"} by ${author.name} on Rebooked right now.`
        : `Second-hand books by ${author.name} on Rebooked.`;

    return pageMeta({
        title: `${author.name}: books on ${SITE_NAME}`,
        description: author.biography || [author.description?.trim(), years, count].filter(Boolean).join(" · "),
        image: author.photoUrl,
        url: loaded?.url,
        type: "profile",
    });
}

/** /author/:slug: who the author is, then their books on Rebooked with the shop's filters (API_CHANGES #23). */
const AuthorPage = ({ loaderData }: Route.ComponentProps) => {
    const { slug = "" } = useParams();
    const authorQuery = useQuery({
        queryKey: ["author", slug],
        queryFn: () => authorService.getBySlug(slug),
        select: (response) => response.data,
        retry: (count, error) => getErrorStatus(error) !== 404 && count < 2,
        enabled: !!slug,
        // Seeded by the loader; the merge redirect above already happened server-side.
        initialData: loaderData?.author ?? undefined,
    });
    const author = authorQuery.data;

    if (authorQuery.isLoading) {
        return (
            <div aria-busy className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-12 md:py-12">
                <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
                <div className="mt-6 h-12 w-2/3 max-w-md animate-pulse rounded bg-secondary" />
                <div className="mt-3 h-4 w-1/2 max-w-sm animate-pulse rounded bg-secondary" />
            </div>
        );
    }
    if (authorQuery.isError && getErrorStatus(authorQuery.error) !== 404) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
                <h1 className="font-serif text-3xl">We couldn't load this author</h1>
                <p className="mt-2 text-foreground/60">Check your connection and try again.</p>
                <Button variant="outline" onClick={() => authorQuery.refetch()} className="mt-6 h-11 rounded-lg px-5 font-semibold">
                    Try again
                </Button>
            </div>
        );
    }
    if (!author) {
        return (
            <NotFoundMessage
                title="Author not found"
                description="We don't have an author at this address. Try searching the shop by name instead."
            />
        );
    }

    const facts = [
        authorYears(author),
        author.description?.trim(),
        `${(author.availableCount ?? 0).toLocaleString()} available`,
        author.soldCount ? `${author.soldCount.toLocaleString()} sold` : "",
    ].filter(Boolean);

    return (
        <ShopBrowser
            key={author.id}
            eyebrow={<Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: author.name }]} />}
            title={author.name}
            subtitle={facts.join(" · ")}
            intro={<AuthorIntro author={author} />}
            fixed={{ authorId: author.id }}
            emptyCatalog={
                <div className="flex flex-col items-center rounded-xl border border-dashed border-foreground/20 bg-card px-6 py-14 text-center">
                    <img src="/brand/rebooked-mark-ink.png" alt="" className="h-12 w-auto opacity-40" />
                    <h2 className="mt-5 font-serif text-2xl">No books by {author.name} right now</h2>
                    <p className="mt-2 max-w-md text-foreground/60">Got one on your shelf? Pass it on to the next reader.</p>
                    <Button asChild variant="outline" className="mt-5 h-11 rounded-md px-5 font-semibold">
                        <Link to="/dashboard/shelf/new">Add a book</Link>
                    </Button>
                </div>
            }
        />
    );
};

export default AuthorPage;
