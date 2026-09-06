import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categories.api";
import type {
  CategoryQueryParams,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/categories.types";

/**
 * Query-key factory for the Categories bounded context.
 *
 * Previously named `bookKeys` — a copy-paste leftover. The cache namespace
 * (`['categories', ...]`) was always correct, so renaming is safe and does not
 * change any cached entry's identity.
 */
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: CategoryQueryParams) =>
    [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

type ApiErrorBody = { message?: string | string[] };

/**
 * Turn an axios error into something an admin can act on.
 *
 * Creating a category whose name already exists violates a unique index that the
 * backend service does not catch, so it arrives as a bare 500 with the default
 * NestJS body ("Internal server error"). Surfacing that verbatim makes the panel
 * look broken, so we substitute a fallback that names the likely cause.
 */
const getErrorMessage = (error: unknown, fallback: string): string => {
  const { response } = (error ?? {}) as AxiosError<ApiErrorBody>;
  const message = response?.data?.message;

  // class-validator returns an array of constraint violations.
  if (Array.isArray(message) && message.length > 0) return message.join(", ");

  if (
    typeof message === "string" &&
    message &&
    message !== "Internal server error"
  ) {
    return message;
  }

  if (response?.status === 500) {
    return `${fallback} A category with this name may already exist — names must be unique.`;
  }

  return fallback;
};

/**
 * List categories.
 *
 * Remember this is a *nested* list: without `parent_id` the API returns only
 * top-level categories, each with one level of `children` embedded.
 */
export const useCategoriesQuery = (params: CategoryQueryParams = {}) => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
    placeholderData: (previousData) => previousData, // keep the old page visible while refetching
  });
};

/*
 * There is deliberately no `useCategoryQuery(id)`. The backend exposes no
 * `GET /categories/:id`, so the hook it used to wrap could never succeed.
 * Screens that need one category read it out of the list instead — see
 * `findCategoryById` in `../utils/categories.utils`.
 */

export const useCategoryMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create category."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => updateCategory(id, payload),
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update category."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete category."));
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
