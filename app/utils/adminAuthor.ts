import type {
  AuditAction,
  AuthorFieldSource,
  AuthorOrigin,
  AuthorSource,
  AuthorStatus,
  ImportStatus,
  ReviewItemType,
} from "~/types/author";

/** Labels and colours for the admin author screens (API_CHANGES #23f). */

export const AUTHOR_STATUS_LABEL: Record<AuthorStatus, string> = {
  NEEDS_REVIEW: "Needs review",
  UNVERIFIED: "Unverified",
  VERIFIED: "Verified",
  MERGED: "Merged",
};

export const AUTHOR_STATUS_PILL: Record<AuthorStatus, string> = {
  NEEDS_REVIEW: "bg-[#c4513f]/12 text-[#9c3a2c]",
  UNVERIFIED: "bg-foreground/10 text-foreground/70",
  VERIFIED: "bg-olive/15 text-olive",
  MERGED: "bg-foreground/8 text-foreground/50",
};

/** Tab order on the list page. */
export const AUTHOR_STATUS_TABS: AuthorStatus[] = ["NEEDS_REVIEW", "UNVERIFIED", "VERIFIED", "MERGED"];

export const AUTHOR_ORIGIN_LABEL: Record<AuthorOrigin, string> = {
  IMPORTED: "Imported",
  USER_PROPOSED: "Added by a seller",
  ADMIN_CREATED: "Added by an admin",
  MIGRATED: "From old listings",
};

export const AUTHOR_SOURCE_LABEL: Record<AuthorSource, string> = {
  OPEN_LIBRARY: "Open Library",
  WIKIDATA: "Wikidata",
  VIAF: "VIAF",
  ISNI: "ISNI",
};

export const FIELD_SOURCE_LABEL: Record<AuthorFieldSource, string> = {
  OPEN_LIBRARY: "Open Library",
  WIKIDATA: "Wikidata",
  ADMIN: "Edited by admin",
  USER: "Seller",
  MIGRATION: "Old listing",
};

export const REVIEW_TYPE_LABEL: Record<ReviewItemType, string> = {
  PROPOSAL: "New author from a seller",
  POSSIBLE_DUPLICATE: "Possible duplicate",
  MIGRATION_AMBIGUOUS: "Unclear match from an old listing",
};

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CREATED: "Created",
  UPDATED: "Edited",
  VERIFIED: "Verified",
  MERGED: "Merged",
  EXTERNAL_ID_ADDED: "Linked an external record",
  EXTERNAL_ID_REMOVED: "Unlinked an external record",
  KEPT_SEPARATE: "Kept separate",
  DELETED: "Deleted",
};

export const IMPORT_STATUS_PILL: Record<ImportStatus, string> = {
  PENDING: "bg-foreground/10 text-foreground/70",
  RUNNING: "bg-primary/12 text-primary",
  COMPLETED: "bg-olive/15 text-olive",
  FAILED: "bg-[#c4513f]/12 text-[#9c3a2c]",
};

export const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—";
