"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options";
import { Skeleton } from "@/components/ui/skeleton";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";

import type { PaginationMeta } from "../types/invoices.types";

interface InvoiceDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/**
 * Server-side aware data table.
 *
 * TanStack Table is configured with manualPagination + manualSorting so that
 * the backend controls what data appears. Local state only drives UI controls;
 * actual fetching is delegated to the parent via onPageChange / onLimitChange.
 */
export function InvoiceDataTable<TData, TValue>({
  columns,
  data,
  meta,
  isLoading,
  onPageChange,
  onLimitChange,
}: InvoiceDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Keep TanStack's internal pagination in sync with server meta
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: (meta?.currentPage ?? 1) - 1,
    pageSize:  meta?.itemsPerPage ?? 10,
  });

  const table = useReactTable({
    data,
    columns,
    // Server-side mode: TanStack does not slice data itself
    manualPagination: true,
    pageCount:        meta?.totalPages ?? -1,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    onSortingChange:          setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange:       setPagination,
    getCoreRowModel:          getCoreRowModel(),
    getSortedRowModel:        getSortedRowModel(),
  });

  // Propagate pagination changes to the parent (which updates the query params)
  React.useEffect(() => {
    onPageChange(pagination.pageIndex + 1);
  }, [pagination.pageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    onLimitChange(pagination.pageSize);
    // Reset to first page when limit changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [pagination.pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalItems   = meta?.totalItems   ?? 0;
  const currentPage  = meta?.currentPage  ?? 1;
  const totalPages   = meta?.totalPages   ?? 1;
  const itemsPerPage = meta?.itemsPerPage ?? 10;
  const rangeStart   = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd     = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <DataTableViewOptions table={table} />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Skeleton rows while fetching
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Row count summary */}
        <p className="text-sm text-muted-foreground">
          {totalItems > 0
            ? `Showing ${rangeStart}–${rangeEnd} of ${totalItems} invoice${totalItems === 1 ? "" : "s"}`
            : "No results"}
        </p>

        <div className="flex items-center gap-6">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) =>
                setPagination((prev) => ({ ...prev, pageSize: Number(v) }))
              }
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page indicator */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <span className="sr-only">First page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <span className="sr-only">Previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <span className="sr-only">Next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <span className="sr-only">Last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
