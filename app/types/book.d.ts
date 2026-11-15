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
}

export interface IBook extends IDocument {
  title: string;
  author?: string | null;
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
}

export interface ICreateBookPayload {
  title: string;
  author: string;
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
