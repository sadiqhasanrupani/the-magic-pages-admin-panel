import { apiClient } from "@/lib/api-client";
import type {
  Category,
  CategoryQueryParams,
  CreateCategoryPayload,
  FindAllResponse,
  UpdateCategoryPayload,
} from "../types/categories.types";

const BASE_URL = "/categories";

/**
 * `GET /categories` — public endpoint, no auth required.
 *
 * Without `parent_id` this returns **top-level categories only**, each with one
 * level of `children` eager-loaded. It is not a flat list of every category.
 */
export const getCategories = async (
  params?: CategoryQueryParams,
): Promise<FindAllResponse> => {
  const { data } = await apiClient.get(BASE_URL, { params });
  return data;
};

/*
 * Intentionally NOT implemented: `getCategory(id)`.
 *
 * The backend has no `GET /categories/:id`. The only single-category route is
 * `GET /categories/:slug` (see `categories.controller.ts`), so calling it with a
 * UUID resolves to a slug lookup that will always 404.
 *
 * The edit screen does not need it anyway: `getCategories` already returns every
 * field the form binds to, so `CategoryForm` resolves a category by id from the
 * cached list instead. See `findCategoryById` in `../utils/categories.utils`.
 */

/** `POST /categories` — admin only (bearer + ADMIN role). */
export const createCategory = async (
  payload: CreateCategoryPayload,
): Promise<Category> => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};

/** `PUT /categories/:id` — admin only. `:id` is the category UUID. */
export const updateCategory = async (
  id: string,
  payload: UpdateCategoryPayload,
): Promise<Category> => {
  const { data } = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return data;
};

/**
 * `DELETE /categories/:id` — admin only.
 *
 * Children are **not** deleted with the parent: the FK is `onDelete: 'SET NULL'`,
 * so any sub-categories are promoted to top-level instead.
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};
