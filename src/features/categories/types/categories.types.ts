/**
 * Frontend types for the Categories bounded context.
 *
 * These mirror the backend contract in
 * `libs/contract/src/books/entities/categories.entity.ts` and
 * `libs/contract/src/categories/dtos/create-category.dto.ts`.
 *
 * Note there is deliberately no `CreateCategoryDto` here — that name belongs to
 * the NestJS class on the backend. The frontend speaks in "payloads".
 */

/**
 * A book category as returned by `GET /categories`.
 *
 * `slug`, `age_group` and `parent_id` are all nullable columns on the entity, so
 * the API genuinely returns `null` for them — they are not merely absent.
 */
export interface Category {
  id: string;
  name: string;
  slug: string | null;
  age_group: string | null;
  parent_id: string | null;
  /**
   * Populated **one level deep only**, and only on the top-level rows returned
   * by `GET /categories` (the service eager-loads `relations: ['children']`).
   * The nested child objects do not carry their own `children` array, which is
   * why this is optional rather than required.
   */
  children?: Category[];
}

/** Body for `POST /categories`. Only `name` is required by the backend DTO. */
export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  age_group?: string;
  parent_id?: string;
}

/** Body for `PUT /categories/:id`. The backend uses `PartialType(CreateCategoryDto)`. */
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Shape of `GET /categories`. The service returns `message`, `data` and `meta`
 * — the previous version of this type omitted `meta` entirely.
 */
export interface FindAllResponse {
  message: string;
  data: Category[];
  meta: PaginationMeta;
}

/**
 * Query params accepted by `GET /categories`.
 *
 * `FindAllCategoriesDto` supports exactly these three. There is no `search` or
 * `status` filter on this endpoint — those fields were previously declared here
 * but the backend silently ignored them.
 *
 * Omitting `parent_id` returns **top-level categories only** (the service
 * filters on `parent IS NULL`), each with its children eager-loaded.
 */
export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  parent_id?: string;
}

/**
 * @deprecated Legacy alias kept so existing imports keep compiling.
 * Prefer {@link CategoryQueryParams}.
 */
export type AgeCategoryParams = CategoryQueryParams;
