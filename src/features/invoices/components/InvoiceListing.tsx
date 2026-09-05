"use client";

import * as React from "react";
import Link from "next/link";
import { IconPlus, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useInvoices } from "../hooks/useInvoices";
import type { InvoiceQueryParams, InvoiceStatus } from "../types/invoices.types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceDataTable } from "./InvoiceDataTable";
import { invoiceColumns } from "./invoice-columns";

const ALL_STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "REFUNDED",
];

export function InvoiceListing() {
  const [page, setPage]     = React.useState(1);
  const [limit, setLimit]   = React.useState(10);
  const [status, setStatus] = React.useState<InvoiceStatus | undefined>();

  const queryParams: InvoiceQueryParams = {
    page,
    limit,
    sortBy:    "createdAt",
    sortOrder: "DESC",
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useInvoices(queryParams);

  const handleStatusChange = (value: string) => {
    setStatus(value === "ALL" ? undefined : (value as InvoiceStatus));
    setPage(1); // reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all customer invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
          >
            <IconRefresh className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>

          <Button asChild>
            <Link href="/invoices/create">
              <IconPlus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={status ?? "ALL"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <InvoiceStatusBadge status={s} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter pill */}
        {status && (
          <button
            onClick={() => handleStatusChange("ALL")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filter ×
          </button>
        )}
      </div>

      {/* Data table */}
      <InvoiceDataTable
        columns={invoiceColumns}
        data={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
