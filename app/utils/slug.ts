import type { ICategory } from "~/types/book";
import { NG_STATES, type NgState } from "./nigeria";

/** "Mystery & Thriller" → "mystery-thriller". */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const categorySlug = (category: Pick<ICategory, "name">) => slugify(category.name);
export const categoryPath = (category: Pick<ICategory, "name">) => `/shop/category/${categorySlug(category)}`;
export const categoryBySlug = (categories: ICategory[], slug?: string) =>
  categories.find((category) => categorySlug(category) === slug);

/** "Federal Capital Territory" → "fct", "Akwa Ibom" → "akwa-ibom". */
export const stateSlug = (state: string) => (state === "Federal Capital Territory" ? "fct" : slugify(state));
export const statePath = (state: string) => `/shop/in/${stateSlug(state)}`;
export const stateFromSlug = (slug?: string): NgState | undefined =>
  NG_STATES.find((state) => stateSlug(state) === slug?.toLowerCase());
