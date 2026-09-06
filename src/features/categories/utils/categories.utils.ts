import type { Category } from "../types/categories.types";

/**
 * Convert a display name into a URL-safe kebab-case slug.
 *
 * Slugs are load-bearing for this entity: the storefront browses categories
 * exclusively by slug (`GET /categories/:slug`, `GET /categories/:slug/books`),
 * so a category saved without one is unreachable to customers.
 *
 * Written locally rather than pulled from a dependency — there is no existing
 * slugify helper in `src/lib`, and the rules here are only a few lines.
 *
 * @example slugify("Picture Books & Rhymes") // "picture-books-rhymes"
 */
export const slugify = (value: string): string =>
  value
    .normalize("NFKD") // separate accented characters into base letter + mark
    .replace(/[\u0300-\u036f]/g, "") // strip the combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics collapses to one hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens

/**
 * Flatten the nested list returned by `GET /categories` into a single array of
 * every category the client currently knows about (parents followed by their
 * children).
 *
 * The API nests exactly one level deep, so a single `flatMap` is sufficient —
 * no recursion required.
 */
export const flattenCategories = (categories: Category[] = []): Category[] =>
  categories.flatMap((category) => [category, ...(category.children ?? [])]);

/**
 * Resolve a category by id from an already-fetched list.
 *
 * This exists because there is no `GET /categories/:id` on the backend. Rather
 * than adding a fetch that cannot work, the edit screen reuses the list query —
 * which already carries every field the form binds to.
 *
 * @returns the matching category, or `undefined` if it is not in the loaded page.
 */
export const findCategoryById = (
  categories: Category[] = [],
  id: string,
): Category | undefined =>
  flattenCategories(categories).find((category) => category.id === id);

/**
 * Case-insensitive check for an existing category with the same name.
 *
 * The backend has a unique index on `name` but does not catch the resulting
 * `QueryFailedError`, so a duplicate surfaces as an opaque 500. This powers a
 * **soft** pre-submit warning only — the loaded list may not contain every
 * category (the endpoint is paginated), so a miss here proves nothing and must
 * never hard-block a submit.
 *
 * @param excludeId id to ignore, so editing a category does not flag itself.
 */
export const findCategoryByName = (
  categories: Category[] = [],
  name: string,
  excludeId?: string,
): Category | undefined => {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;

  return flattenCategories(categories).find(
    (category) =>
      category.id !== excludeId &&
      category.name.trim().toLowerCase() === needle,
  );
};
