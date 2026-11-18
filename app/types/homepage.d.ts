import type { IAuthorDetail, IAuthorSummary } from "./author";
import type { IBook, ICategory } from "./book";
import type { IFile } from "./file";
import type { ISellerProfile } from "./user";

/** GET /homepage and /homepage/stats (API_CHANGES #24c). */
export interface IHomepageStats {
  activeBooks: number;
  booksSold: number;
  readers: number;
  sellers: number;
  authors: number;
  /** null until there are 10 ratings. */
  avgSellerRating: number | null;
}

/** One AI pick: the live book and the model's one-sentence reason (#24e). */
export interface IAiPick {
  book: IBook;
  reason: string;
}

/** This week's featured set (#24d). Either half may be null. */
export interface IHomepageFeatured {
  category: ICategory | null;
  books: IBook[];
  author: (IAuthorDetail & { books: IBook[] }) | null;
  source: "AUTO" | "ADMIN";
}

/** A top author of the week: an author summary plus photo and the week's score (#24d). */
export interface IHomepageAuthor extends IAuthorSummary {
  photoUrl?: string | null;
  weekScore: number;
}

/** A recent review (#24g). Never carries the reviewer's email, full name or id. */
export interface IHomepageReview {
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { userName?: string | null; profilePictureUrl?: string | null };
  book: { id: string; title: string; coverImage?: IFile | null };
}

/**
 * GET /homepage (#24b): every public section in one response. A section that failed
 * on the server is null (objects) or [] (lists); the page hides it.
 */
export interface IHomepage {
  generatedAt: string;
  /** ISO Monday of the current week, Africa/Lagos. */
  weekOf: string;
  hero: IBook[];
  stats: IHomepageStats | null;
  categories: ICategory[];
  featured: IHomepageFeatured | null;
  aiPicks: IAiPick[];
  trending: IBook[];
  newArrivals: IBook[];
  topAuthors: IHomepageAuthor[];
  reviews: IHomepageReview[];
  /** Public seller profiles with availableCount, soldCount and rating. */
  sellers: ISellerProfile[];
}

/** GET /homepage/for-you (#24f). `personalised: false` means these are the global picks. */
export interface IForYou {
  aiPicks: IAiPick[];
  basedOn: string[];
  personalised: boolean;
}
