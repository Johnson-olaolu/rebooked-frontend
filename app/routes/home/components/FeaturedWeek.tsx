"use client";

import { Link } from "react-router";
import BookShelf from "~/components/shop/BookShelf";
import UserAvatar from "~/components/UserAvatar";
import { useHomepage } from "~/hooks/useHomepage";
import type { IHomepageFeatured } from "~/types/homepage";
import { authorPath, authorYears } from "~/utils/author";
import { bookPath } from "~/utils/book";
import { categoryPath } from "~/utils/slug";
import HomeBand from "./HomeBand";

/** The featured author: photo, years, a short bio and a few of their books on the shelf. */
const AuthorSpotlight = ({ author }: { author: NonNullable<IHomepageFeatured["author"]> }) => {
    const years = authorYears(author);
    return (
        <aside aria-labelledby="featured-author" className="rounded-xl border border-border bg-card p-6">
            <div className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">Author of the week</div>
            <div className="mt-4 flex items-center gap-4">
                <UserAvatar name={author.name} photoUrl={author.photoUrl} className="size-16 text-xl" />
                <div className="min-w-0">
                    <h3 id="featured-author" className="font-serif text-2xl leading-tight">
                        <Link to={authorPath(author)} className="hover:underline">
                            {author.name}
                        </Link>
                    </h3>
                    {years && <div className="mt-0.5 text-sm text-foreground/55">{years}</div>}
                </div>
            </div>
            {(author.biography || author.description) && (
                <p className="mt-4 line-clamp-4 text-foreground/70">{author.biography || author.description}</p>
            )}
            {author.books.length > 0 && (
                <ul className="mt-5 flex gap-3">
                    {author.books.slice(0, 4).map((book) => (
                        <li key={book.id} className="w-16 shrink-0">
                            <Link to={bookPath(book)} title={book.title} className="block aspect-[3/4] overflow-hidden rounded border border-border bg-secondary hover:opacity-85">
                                {book.coverImage?.url ? (
                                    <img src={book.coverImage.url} alt={book.title} className="size-full object-cover" />
                                ) : (
                                    <span className="flex size-full items-center justify-center p-1 text-center text-[10px] leading-tight text-foreground/55">{book.title}</span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Link to={authorPath(author)} className="mt-5 inline-block font-semibold text-primary hover:underline">
                {author.availableCount ? `All ${author.availableCount} on the shelf →` : "About the author →"}
            </Link>
        </aside>
    );
};

/** Home "Featured this week" (API_CHANGES #24d): the week's category shelf and author spotlight. */
const FeaturedWeek = ({ tinted }: { tinted?: boolean }) => {
    const { data: featured } = useHomepage((homepage) => homepage.featured);
    const category = featured?.category && featured.books.length > 0 ? featured.category : null;
    const author = featured?.author ?? null;
    if (!category && !author) return null;

    return (
        <HomeBand tinted={tinted}>
            <div className={category && author ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]" : undefined}>
                {category && (
                    <BookShelf
                        size="large"
                        className="min-w-0"
                        eyebrow="Featured this week"
                        title={category.name}
                        description={category.description || undefined}
                        action={
                            <Link to={categoryPath(category)} className="font-semibold text-primary hover:underline">
                                See all →
                            </Link>
                        }
                        books={featured!.books}
                        loading={false}
                        error={false}
                        onRetry={() => undefined}
                    />
                )}
                {author && <AuthorSpotlight author={author} />}
            </div>
        </HomeBand>
    );
};

export default FeaturedWeek;
