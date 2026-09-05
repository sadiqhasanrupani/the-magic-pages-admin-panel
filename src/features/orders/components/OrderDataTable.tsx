'use client';

import * as React from 'react';
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableViewOptions } from '@/components/ui/data-table/data-table-view-options';
import { Skeleton } from '@/components/ui/skeleton';

import type { OrdersPaginationMeta } from '../types/orders.types';

interface OrderDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta: OrdersPaginationMeta | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/**
 * Server-side aware orders table.
 *
 * Two deliberate differences from `InvoiceDataTable`:
 *
 *  1. It reads the orders meta shape (`total`/`page`/`limit`/`hasNextPage`/
 *     `hasPreviousPage`), not the invoices one
 *     (`totalItems`/`currentPage`/`itemsPerPage`). The two endpoints genuinely
 *     return different keys; this stays faithful to the wire.
 *
 *  2. Pagination is NOT mirrored into local state and pushed back out through
 *     effects. The invoices table keeps a local `PaginationState` and syncs it
 *     to the parent in `useEffect`, which fires both effects on mount and makes
 *     the server response and the local state two sources of truth. Here the
 *     server's `meta` is the only source of truth and the buttons call the
 *     parent handlers directly — fewer renders, no reset loop, and the control
 *     enabled-state always matches what the server actually returned.
 *
 *  3. Sorting is DISABLED outright (`enableSorting: false`), not merely
 *     unwired. `GET /admin/orders` accepts no sortBy/sortOrder and always
 *     returns newest-first, so a client sort would reorder only the rows on the
 *     current page — presenting "sorted by total, descending" over 20 of 137
 *     rows, which is worse than not offering it. `DataTableColumnHeader`
 *     degrades to a plain label when a column cannot sort, so the headers still
 *     render correctly. Re-enable this the day the endpoint supports sorting.
 */
export function OrderDataTable<TData, TValue>({
  columns,
  data,
  meta,
  isLoading,
  onPageChange,
  onLimitChange,
}: OrderDataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? 1;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);
  const limit = meta?.limit ?? 20;
  const hasNext = meta?.hasNextPage ?? false;
  const hasPrevious = meta?.hasPreviousPage ?? false;

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const rangeEnd = Math.min(currentPage * limit, total);

  const table = useReactTable({
    data,
    columns,
    // Server-side mode: TanStack never slices or reorders the rows itself.
    manualPagination: true,
    enableSorting: false,
    pageCount: totalPages,
    state: {
      columnVisibility,
      pagination: { pageIndex: currentPage - 1, pageSize: limit },
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const navDisabled = isLoading;

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
              Array.from({ length: Math.min(limit, 10) }).map((_, i) => (
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
                <TableRow key={row.id}>
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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total > 0
            ? `Showing ${rangeStart}–${rangeEnd} of ${total} order${total === 1 ? '' : 's'}`
            : 'No results'}
        </p>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="text-sm text-muted-foreground whitespace-nowrap"
              id="orders-rows-per-page"
            >
              Rows per page
            </span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger
                className="h-8 w-16"
                aria-labelledby="orders-rows-per-page"
              >
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

          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(1)}
              disabled={!hasPrevious || navDisabled}
            >
              <span className="sr-only">First page</span>
              <IconChevronsLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrevious || navDisabled}
            >
              <span className="sr-only">Previous page</span>
              <IconChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext || navDisabled}
            >
              <span className="sr-only">Next page</span>
              <IconChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNext || navDisabled}
            >
              <span className="sr-only">Last page</span>
              <IconChevronsRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
