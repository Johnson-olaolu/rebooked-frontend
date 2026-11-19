import type { MetaDescriptor } from "react-router";

export const SITE_NAME = "Rebooked";

/** Search results cut off around here; past it the tail is wasted. */
const DESCRIPTION_LIMIT = 160;

/** One line of plain text, collapsed and cut on a word boundary. */
export const summarise = (text: string | null | undefined, limit = DESCRIPTION_LIMIT): string | undefined => {
  const flat = text?.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
};

export interface PageMetaInput {
  /** Shown verbatim in the tab and in results — already include "· Rebooked" if you want it. */
  title: string;
  description?: string | null;
  /** Absolute URL. Relative paths are ignored by most crawlers when they scrape OG images. */
  image?: string | null;
  /** Absolute canonical URL for this page. Loaders get it from `new URL(request.url)`. */
  url?: string;
  type?: "website" | "article" | "book" | "profile";
  /** Pages behind a login, or duplicates of a canonical one, shouldn't be indexed. */
  noIndex?: boolean;
}

/**
 * The tags every public page should carry: title, description, Open Graph, Twitter card
 * and a canonical link. Route `meta` exports replace the root's, so each public route
 * builds its full set here rather than relying on a default.
 */
export const pageMeta = ({ title, description, image, url, type = "website", noIndex }: PageMetaInput): MetaDescriptor[] => {
  const summary = summarise(description);
  const tags: MetaDescriptor[] = [
    { title },
    { property: "og:title", content: title },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: type },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
  ];

  if (summary) {
    tags.push(
      { name: "description", content: summary },
      { property: "og:description", content: summary },
      { name: "twitter:description", content: summary },
    );
  }
  if (image) {
    tags.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
  }
  if (url) {
    tags.push({ property: "og:url", content: url }, { tagName: "link", rel: "canonical", href: url });
  }
  if (noIndex) tags.push({ name: "robots", content: "noindex, nofollow" });

  return tags;
};

/** Absolute origin + path for canonical/OG URLs, from the loader's request. */
export const canonicalUrl = (request: Request, path?: string): string => {
  const url = new URL(request.url);
  return `${url.origin}${path ?? url.pathname}`;
};
