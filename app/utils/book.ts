import type { BookCondition, BookStatus, IBook } from "~/types/book";

export const BOOK_CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like new" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

export const CONDITION_HINTS: Record<BookCondition, string> = {
  NEW: "New = never read, no marks at all.",
  LIKE_NEW: "Like new = read once or twice, looks unread.",
  GOOD: "Good = read, intact, maybe a crease.",
  FAIR: "Fair = well read: worn cover, notes or highlights, but nothing missing.",
};

export const conditionLabel = (condition?: BookCondition | null) =>
  BOOK_CONDITIONS.find((item) => item.value === condition)?.label ?? "";

/** Shelf tab labels (docs/TERMINOLOGY.md). */
export const SHELF_TABS: { status: BookStatus; label: string }[] = [
  { status: "ACTIVE", label: "Available" },
  { status: "DRAFT", label: "Drafts" },
  { status: "SOLD", label: "Sold" },
  { status: "INACTIVE", label: "Archived" },
];

/** Status pill text (docs/TERMINOLOGY.md) and colours. */
export const STATUS_LABEL: Record<BookStatus, string> = {
  ACTIVE: "Available",
  DRAFT: "Draft",
  SOLD: "Sold",
  INACTIVE: "Archived",
};

export const STATUS_PILL: Record<BookStatus, string> = {
  ACTIVE: "bg-olive/15 text-olive",
  DRAFT: "bg-foreground/10 text-foreground/70",
  SOLD: "bg-primary/12 text-primary",
  INACTIVE: "bg-foreground/8 text-foreground/55",
};

export const BOOK_LIMITS = { title: 200, description: 600, photos: 5 } as const;

/** ISBN-10 or ISBN-13 once spaces and dashes are removed. */
export const normalizeIsbn = (isbn: string) => isbn.replace(/[\s-]/g, "").toUpperCase();
export const isValidIsbn = (isbn: string) => /^(\d{9}[\dX]|\d{13})$/.test(normalizeIsbn(isbn));

/** The public book page. */
export const bookPath = (book: Pick<IBook, "id">) => `/book/${book.id}`;
/** The owner's edit page (drafts are finished here too). */
export const editPath = (book: Pick<IBook, "id">) => `/dashboard/shelf/${book.id}/edit`;
