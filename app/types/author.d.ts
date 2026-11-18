import type { ISellerSummary } from "./book";

/** API_CHANGES #23. */
export type AuthorStatus = "UNVERIFIED" | "VERIFIED" | "NEEDS_REVIEW" | "MERGED";
export type AuthorOrigin = "IMPORTED" | "USER_PROPOSED" | "ADMIN_CREATED" | "MIGRATED";
export type AuthorSource = "OPEN_LIBRARY" | "WIKIDATA" | "VIAF" | "ISNI";
export type AuthorFieldSource = "OPEN_LIBRARY" | "WIKIDATA" | "ADMIN" | "USER" | "MIGRATION";

/** Search results, proposals, top authors (#23c). */
export interface IAuthorSummary {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  birthYear?: number | null;
  deathYear?: number | null;
  /** Short line that tells same-name authors apart, e.g. "Nigerian novelist". */
  description?: string | null;
  /** ACTIVE books on Rebooked by this author. */
  availableCount?: number;
  /** Set when the query matched an alias rather than the name. */
  matchedAlias?: string | null;
}

/** `GET /author/slug/{slug}`: a merged author comes back as the canonical one (with its slug). */
export interface IAuthorDetail extends IAuthorSummary {
  soldCount?: number;
  biography?: string | null;
  photoUrl?: string | null;
  aliases?: string[];
  links?: { openLibrary?: string | null; wikidata?: string | null; wikipedia?: string | null };
  /** Sources behind the details shown, for the attribution line. */
  attribution?: ("OPEN_LIBRARY" | "WIKIDATA")[];
}

/** `POST /author/proposals`: either the new author, or close matches to choose from first. */
export interface IProposeAuthorResult {
  author: IAuthorSummary | null;
  candidates: IAuthorSummary[];
}

/* Admin (#23f) */

export interface IAuthorExternalId {
  source: AuthorSource;
  sourceId: string;
  url?: string | null;
}

export interface IAuthorAlias {
  name: string;
  source?: AuthorFieldSource | null;
}

/** A row in the admin list. */
export interface IAdminAuthorRow extends IAuthorSummary {
  origin: AuthorOrigin;
  status: AuthorStatus;
  soldCount?: number;
  openReviewItems?: number;
  /** Which external catalogues it's linked to. */
  sources?: AuthorSource[];
}

export interface IAdminAuthorPage {
  content: IAdminAuthorRow[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  counts?: Partial<Record<AuthorStatus, number>>;
}

export type ReviewItemType = "PROPOSAL" | "POSSIBLE_DUPLICATE" | "MIGRATION_AMBIGUOUS";
export type ReviewResolution = "VERIFIED" | "MERGED" | "KEPT_SEPARATE" | "DELETED";

export interface IAuthorReviewItem {
  id: string;
  type: ReviewItemType;
  status: "OPEN" | "RESOLVED";
  reason?: string | null;
  resolution?: ReviewResolution | null;
  author: IAdminAuthorRow & { externalIds?: IAuthorExternalId[] };
  otherAuthor?: (IAdminAuthorRow & { externalIds?: IAuthorExternalId[] }) | null;
  createdAt: string;
}

/** `GET /admin/author/{id}` (and both sides of a merge preview). Unlike the public detail, aliases carry their source. */
export interface IAdminAuthor extends Omit<IAuthorDetail, "aliases"> {
  origin: AuthorOrigin;
  status: AuthorStatus;
  mergedIntoAuthorId?: string | null;
  fieldSources?: Partial<Record<string, AuthorFieldSource>>;
  externalIds?: IAuthorExternalId[];
  aliases?: IAuthorAlias[];
  createdBy?: ISellerSummary | null;
  openReviewItems?: IAuthorReviewItem[];
  workCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAdminAuthorUpdate {
  name?: string;
  aliases?: string[];
  biography?: string;
  description?: string;
  birthYear?: number | null;
  deathYear?: number | null;
}

export interface IMergePreview {
  from: IAdminAuthor & { bookCount?: number };
  into: IAdminAuthor & { bookCount?: number };
  /** Books that list both authors; the duplicate entry is dropped from them. */
  sharedBooks: { id: string; title: string }[];
}

export type AuditAction =
  | "CREATED"
  | "UPDATED"
  | "VERIFIED"
  | "MERGED"
  | "EXTERNAL_ID_ADDED"
  | "EXTERNAL_ID_REMOVED"
  | "KEPT_SEPARATE"
  | "DELETED";

export interface IAuthorAuditEntry {
  id: string;
  action: AuditAction;
  actor?: ISellerSummary | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
  createdAt: string;
}

export type ImportSource = "OPEN_LIBRARY" | "WIKIDATA";
export type ImportStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface IAuthorImportJob {
  id: string;
  source: ImportSource;
  datasetVersion?: string | null;
  status: ImportStatus;
  recordsRead?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsSkipped?: number;
  recordsNeedingReview?: number;
  recordsFailed?: number;
  errorSummary?: string | null;
  coverage?: { NG?: number; africa?: number } | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface IAuthorImportError {
  line?: number | null;
  sourceId?: string | null;
  message: string;
  createdAt: string;
}

export interface IPage<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
