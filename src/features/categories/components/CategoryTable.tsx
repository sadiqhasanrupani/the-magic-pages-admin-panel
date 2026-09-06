"use client";

import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgeGroupsQuery } from "@/features/age-groups/hooks/useAgeGroups";
import {
  useCategoriesQuery,
  useCategoryMutation,
} from "../hooks/useCategories";
import type { Category } from "../types/categories.types";
import { findCategoryById } from "../utils/categories.utils";

/** Columns rendered, used to keep `colSpan` on the empty/error rows honest. */
const COLUMN_COUNT = 6;

export function CategoryTable() {
  // The list endpoint returns top-level categories with one level of children
  // embedded, so this single query backs the whole tree — no per-row fetching.
  const { data, isLoading, isError, error } = useCategoriesQuery({
    limit: 100,
  });
  const { deleteMutation } = useCategoryMutation();
  const { data: ageGroupData } = useAgeGroupsQuery();

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const categories = data?.data ?? [];

  /** Map an age-group id (e.g. "3-5") to its display label (e.g. "Ages 3-5"). */
  const ageGroupLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const ageGroup of ageGroupData?.data ?? []) {
      labels.set(ageGroup.id, ageGroup.label);
    }
    return labels;
  }, [ageGroupData]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Resolved so the confirmation dialog can warn about orphaned children.
  const pendingDeletion = categoryToDelete
    ? findCategoryById(categories, categoryToDelete)
    : undefined;
  const pendingChildCount = pendingDeletion?.children?.length ?? 0;

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteMutation.mutateAsync(categoryToDelete);
      setCategoryToDelete(null);
    } catch {
      // The mutation's onError already surfaces a toast. Keeping the dialog open
      // lets the admin retry rather than silently losing their intent.
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const renderAgeGroup = (category: Category) => {
    if (!category.age_group) {
      return <span className="text-muted-foreground">—</span>;
    }
    return (
      <Badge variant="outline" className="font-normal">
        {ageGroupLabels.get(category.age_group) ?? category.age_group}
      </Badge>
    );
  };

  const renderSlug = (category: Category) =>
    category.slug ? (
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
        {category.slug}
      </code>
    ) : (
      // A slug-less category cannot be reached from the storefront at all, so
      // this is a real content defect rather than a cosmetic blank.
      <Badge variant="destructive" className="text-[10px]">
        Missing slug
      </Badge>
    );

  const renderActions = (category: Category) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${category.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href={`/categories/${category.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => setCategoryToDelete(category.id)}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead className="text-right">Sub-categories</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-24 text-center">
                  <p className="text-destructive font-medium">
                    Could not load categories.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {error instanceof Error
                      ? error.message
                      : "Please try again."}
                  </p>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-24 text-center">
                  No categories found. Create one to let customers browse the
                  store.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => {
                const children = category.children ?? [];
                const hasChildren = children.length > 0;
                const isExpanded = expandedIds.has(category.id);

                return [
                  <TableRow key={category.id}>
                    {/* Expand / collapse */}
                    <TableCell>
                      {hasChildren ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleExpanded(category.id)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? `Collapse sub-categories of ${category.name}`
                              : `Expand sub-categories of ${category.name}`
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                    </TableCell>

                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>{renderSlug(category)}</TableCell>
                    <TableCell>{renderAgeGroup(category)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {hasChildren ? (
                        children.length
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{renderActions(category)}</TableCell>
                  </TableRow>,

                  ...(isExpanded
                    ? children.map((child) => (
                        <TableRow key={child.id} className="bg-muted/30">
                          <TableCell />
                          <TableCell className="font-normal">
                            <span className="flex items-center gap-2 pl-4">
                              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {child.name}
                            </span>
                          </TableCell>
                          <TableCell>{renderSlug(child)}</TableCell>
                          <TableCell>{renderAgeGroup(child)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            —
                          </TableCell>
                          <TableCell>{renderActions(child)}</TableCell>
                        </TableRow>
                      ))
                    : []),
                ];
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {pendingDeletion
                ? ` "${pendingDeletion.name}"`
                : " this category"}
              . Any books assigned to it will lose that categorisation, and the
              storefront URL for its slug will stop resolving.
              {pendingChildCount > 0 && (
                <>
                  {" "}
                  <strong>
                    This category has {pendingChildCount} sub-categor
                    {pendingChildCount === 1 ? "y" : "ies"}, which will become
                    top-level categories rather than being deleted.
                  </strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
