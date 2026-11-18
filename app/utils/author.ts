import type { IAuthorSummary } from "~/types/author";
import type { IBookAuthor } from "~/types/book";

/** A book can list up to this many authors (API_CHANGES #23b). */
export const MAX_BOOK_AUTHORS = 10;
/** Letters needed before the author search runs. */
export const AUTHOR_SEARCH_MIN = 2;

/** "A", "A & B", "A, B & C", then "A, B + 2 more". */
export const authorLine = (authors?: Pick<IBookAuthor, "name">[] | null) => {
    const names = (authors ?? []).map((author) => author.name).filter(Boolean);
    if (names.length <= 1) return names[0] ?? "";
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    if (names.length === 3) return `${names[0]}, ${names[1]} & ${names[2]}`;
    return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
};

/** "1930–2013", "b. 1977", "d. 1890" or "". */
export const authorYears = (author: Pick<IAuthorSummary, "birthYear" | "deathYear">) => {
    const { birthYear, deathYear } = author;
    if (birthYear && deathYear) return `${birthYear}–${deathYear}`;
    if (birthYear) return `b. ${birthYear}`;
    if (deathYear) return `d. ${deathYear}`;
    return "";
};

/** The muted second line under an author's name: years, who they are, and how many books are on Rebooked. */
export const authorContext = (author: IAuthorSummary) =>
    [
        authorYears(author),
        author.description?.trim(),
        author.availableCount ? `${author.availableCount.toLocaleString()} on Rebooked` : "",
    ]
        .filter(Boolean)
        .join(" · ");

/** Alias names, whether the API sent plain strings (public) or `{ name, source }` (admin). */
export const aliasNames = (aliases?: (string | { name: string })[] | null) =>
    (aliases ?? []).map((alias) => (typeof alias === "string" ? alias : alias.name)).filter(Boolean);

export const authorPath = (author: Pick<IBookAuthor, "slug">) => `/author/${author.slug}`;

/** For the book form: a book's cached author entry, shaped like a search result. */
export const bookAuthorToSummary = (author: IBookAuthor): IAuthorSummary => ({
    id: author.id,
    name: author.name,
    slug: author.slug,
    // The form only needs id/name for chips; verification isn't shown there.
    verified: true,
});
