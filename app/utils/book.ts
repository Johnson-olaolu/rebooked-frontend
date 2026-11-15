import type { BookCondition, BookStatus } from "~/types/book";

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

export const BOOK_LIMITS = { title: 200, author: 120, description: 600, photos: 5 } as const;

/** ISBN-10 or ISBN-13 once spaces and dashes are removed. */
export const normalizeIsbn = (isbn: string) => isbn.replace(/[\s-]/g, "").toUpperCase();
export const isValidIsbn = (isbn: string) => /^(\d{9}[\dX]|\d{13})$/.test(normalizeIsbn(isbn));
