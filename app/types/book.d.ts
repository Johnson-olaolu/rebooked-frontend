import type { ISellerRating } from "./user";
import type { IDocument } from "./api";
import type { IFile } from "./file";

export type BookCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";

/** ACTIVE = Available, INACTIVE = Archived (see docs/TERMINOLOGY.md). */
export type BookStatus = "ACTIVE" | "DRAFT" | "SOLD" | "INACTIVE";

export interface ICategory extends IDocument {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isSeeded?: boolean;
  booksCount?: number | null;
}

export interface ITag extends IDocument {
  name: string;
}

/** Public seller summary (API_CHANGES #15e) — never the full user. */
export interface ISellerSummary {
  id: string;
  userName?: string | null;
  profilePictureUrl?: string | null;
  city?: string | null;
  state?: string | null;
  /** API_CHANGES #22c. */
  rating?: ISellerRating | null;
}

/** Copied from the seller's address onto the book (API_CHANGES #17a). */
/** One of a book's authors, in display order (API_CHANGES #23b). `name`/`slug` are a cache of the author record. */
export interface IBookAuthor {
  id: string;
  name: string;
  slug: string;
}

export interface IBookLocation {
  state?: string | null;
  city?: string | null;
}

export interface IBook extends IDocument {
  title: string;
  authors?: IBookAuthor[];
  isbn?: string | null;
  condition?: BookCondition | null;
  isFree?: boolean;
  price?: number | null;
  description?: string | null;
  coverImage?: IFile | null;
  images?: IFile[];
  categories?: ICategory[];
  tags?: ITag[];
  status: BookStatus;
  viewCount?: number;
  soldDate?: string | null;
  seller?: ISellerSummary;
  location?: IBookLocation | null;
}

export interface ICreateBookPayload {
  title: string;
  /** In display order. Never names: new authors are proposed first (`POST /author/proposals`). */
  authorIds: string[];
  isbn: string;
  condition?: BookCondition;
  isFree: boolean;
  price: number;
  description: string;
  categoryIds: string[];
  tagNames: string[];
  imageIds: string[];
  /** Always one of `imageIds` (the picked cover, else the first photo). Omitted only when there are no photos. */
  coverImageId?: string;
  status: "ACTIVE" | "DRAFT";
}

/** `PATCH /book/{id}`: every form field is sent, so cleared fields are saved as cleared. Status changes go through `/status`. */
export type IUpdateBookPayload = Omit<ICreateBookPayload, "status">;

/** `GET /book/me` (API_CHANGES #15c). */
export interface IShelfPage {
  content: IBook[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  counts: Record<BookStatus, number>;
}

export interface IShelfQuery {
  status?: BookStatus;
  page?: number;
  pageSize?: number;
}

/** RELEVANCE ("Best match") only applies while searching; the API defaults to it when `search` is set and `sort` isn't. */
export type ShopSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "RELEVANCE";

/** `GET /book/query` (public). Lists are sent comma-separated. See API_CHANGES #17b. */
export interface IBookQuery {
  search?: string;
  categoryIds?: string[];
  states?: string[];
  conditions?: BookCondition[];
  minPrice?: number;
  maxPrice?: number;
  free?: boolean;
  sort?: ShopSort;
  userId?: string;
  /** Books by one author: the author page (#23d). */
  authorId?: string;
  /** ACTIVE (default) or SOLD; SOLD needs `userId` (#17f). */
  status?: "ACTIVE" | "SOLD";
  page?: number;
  pageSize?: number;
}

/** Per-filter counts, each ignoring its own group (#17c). Optional until the backend sends them. */
export interface IShopFacets {
  categories?: Record<string, number>;
  states?: Record<string, number>;
  conditions?: Partial<Record<BookCondition, number>>;
  free?: number;
}

export interface IShopPage {
  content: IBook[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  facets?: IShopFacets;
  addedToday?: number;
}
