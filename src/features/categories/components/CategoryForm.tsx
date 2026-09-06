"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import Header from "@/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useAgeGroupsQuery } from "@/features/age-groups/hooks/useAgeGroups";
import {
  useCategoriesQuery,
  useCategoryMutation,
} from "../hooks/useCategories";
import type { CreateCategoryPayload } from "../types/categories.types";
import {
  findCategoryById,
  findCategoryByName,
  slugify,
} from "../utils/categories.utils";

/**
 * Radix `Select` cannot use "" as an item value, so optional selects need a
 * sentinel that we translate back to "omitted" on submit.
 */
const NONE_VALUE = "__none__";

const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  // Required here even though the backend DTO marks it optional: the storefront
  // browses categories only by slug, so a blank slug means the category is
  // invisible to customers. Auto-filled from the name, so this rarely fires.
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required — the storefront finds categories by slug")
    .max(150, "Slug must be 150 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens (e.g. picture-books)",
    ),
  age_group: z.string().max(32).optional(),
  parent_id: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export interface CategoryFormProps {
  /** Omit for create mode. In edit mode this is the category's UUID. */
  categoryId?: string;
}

export function CategoryForm({ categoryId }: CategoryFormProps) {
  const router = useRouter();
  const isEditMode = !!categoryId;

  // One query serves three purposes: resolving the category being edited,
  // populating the parent dropdown, and the soft duplicate-name check. There is
  // no GET /categories/:id on the backend, so this is also the *only* way to
  // load an existing category for editing.
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategoriesQuery({ limit: 100 });

  const { data: ageGroupData, isLoading: ageGroupsLoading } =
    useAgeGroupsQuery();
  const { createMutation, updateMutation } = useCategoryMutation();

  const categories = categoriesData?.data ?? [];
  const existingCategory = categoryId
    ? findCategoryById(categories, categoryId)
    : undefined;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      age_group: undefined,
      parent_id: undefined,
    },
  });

  /**
   * Tracks whether the admin has hand-edited the slug. Once they have, the
   * name field stops overwriting it — auto-suggestion should be a convenience,
   * never a field that fights the user.
   */
  const slugManuallyEdited = useRef(false);

  const { reset } = form;

  // Populate the form once the category being edited arrives from the list query.
  useEffect(() => {
    if (!existingCategory) return;

    slugManuallyEdited.current = true; // an existing slug is already deliberate
    reset({
      name: existingCategory.name,
      slug: existingCategory.slug ?? slugify(existingCategory.name),
      age_group: existingCategory.age_group ?? undefined,
      parent_id: existingCategory.parent_id ?? undefined,
    });
  }, [existingCategory, reset]);

  const nameValue = form.watch("name");

  /**
   * Soft duplicate warning. The backend's unique index on `name` throws an
   * uncaught error that surfaces as an opaque 500, so warning early is kinder.
   * Deliberately not a validation error: the list is paginated, so its absence
   * here does not prove the name is free, and blocking on incomplete data would
   * be worse than a 500.
   */
  const duplicateName = useMemo(
    () => findCategoryByName(categories, nameValue ?? "", categoryId),
    [categories, nameValue, categoryId],
  );

  const parentOptions = useMemo(
    // Only top-level categories can be parents — the API nests one level deep,
    // and a category cannot be its own parent.
    () => categories.filter((category) => category.id !== categoryId),
    [categories, categoryId],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: CategoryFormValues) => {
    const payload: CreateCategoryPayload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      // Send `undefined` rather than "" so the backend stores NULL instead of
      // an empty string that would fail an equality lookup later.
      age_group: values.age_group || undefined,
      parent_id: values.parent_id || undefined,
    };

    try {
      if (isEditMode && categoryId) {
        await updateMutation.mutateAsync({ id: categoryId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.push("/categories");
    } catch {
      // Errors are surfaced as toasts by the mutation's onError. Staying on the
      // form preserves the admin's input so they can correct and retry.
    }
  };

  // --- Edit-mode gates -----------------------------------------------------

  if (isEditMode && categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (isEditMode && categoriesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load categories. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isEditMode && !existingCategory) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Category not found</AlertTitle>
        <AlertDescription>
          No category matches this id in the loaded list. It may have been
          deleted, or it may fall outside the first page of results.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Header
          title={isEditMode ? "Edit Category" : "Create New Category"}
          isSubmitting={isSubmitting}
          description={`Fill in the details below to ${isEditMode ? "update" : "create"} a category.`}
          buttonText={isEditMode ? "Save Changes" : "Create Category"}
          showButton={true}
        />

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>
              Categories drive how customers browse the storefront.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Picture Books"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        // Keep the slug in step with the name until the admin
                        // takes ownership of the slug themselves.
                        if (!slugManuallyEdited.current) {
                          form.setValue("slug", slugify(event.target.value), {
                            shouldValidate: form.formState.isSubmitted,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown to customers. Must be unique across all categories.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {duplicateName && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>This name looks like a duplicate</AlertTitle>
                <AlertDescription>
                  &quot;{duplicateName.name}&quot; already exists. Category
                  names must be unique, so saving this will most likely fail.
                  You can still submit if you believe this is wrong.
                </AlertDescription>
              </Alert>
            )}

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. picture-books"
                      {...field}
                      onChange={(event) => {
                        slugManuallyEdited.current = true;
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Used in storefront URLs. Suggested from the name — edit it
                    if you need to, but changing it on an existing category will
                    break any shared links.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Age group */}
            <FormField
              control={form.control}
              name="age_group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? undefined : value)
                    }
                    value={field.value ?? NONE_VALUE}
                    disabled={ageGroupsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an age group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>None</SelectItem>
                      {ageGroupData?.data?.map((ageGroup) => (
                        <SelectItem key={ageGroup.id} value={ageGroup.id}>
                          {ageGroup.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional. Uses the same age groups as books, so age-based
                    browsing stays consistent across the storefront.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? undefined : value)
                    }
                    value={field.value ?? NONE_VALUE}
                    disabled={categoriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>
                        None (top-level category)
                      </SelectItem>
                      {parentOptions.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional. Leave as &quot;None&quot; for a top-level
                    category. Nesting is supported one level deep.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
