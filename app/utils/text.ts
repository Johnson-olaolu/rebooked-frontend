/**
 * Display-only casing (docs/TERMINOLOGY.md → Casing). Stored values are never changed, and user
 * content (messages, book titles, descriptions) is never re-cased.
 */

/** "buying from you" → "Buying from you". */
export const capitalizeFirst = (text: string) => (text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text);

/**
 * People's names as typed, tidied for display: each word that's entirely lowercase gets a capital
 * ("kastroud" → "Kastroud", "ola j." → "Ola J."). Words with any capital already ("McKenzie",
 * "DJ", "deRoy") are left as the person wrote them.
 */
export const displayName = (name?: string | null) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word === word.toLocaleLowerCase() ? capitalizeFirst(word) : word))
    .join(" ");

/** Hand-typed places get the same treatment ("warri" → "Warri"). */
export const displayPlace = displayName;
