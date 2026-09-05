"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical, IconCopy, IconReceipt } from "@tabler/icons-react";
import { toast } from "sonner";

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
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import type { Invoice } from "../types/invoices.types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

// ── Formatters ─────────────────────────────────────────────────────────────

// Backend numeric columns arrive as strings; parse before formatting.
export const formatCurrency = (amount: string, currency = "INR"): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ── Column definitions ─────────────────────────────────────────────────────

export const invoiceColumns: ColumnDef<Invoice>[] = [
  // 1. Invoice number
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
    cell: ({ row }) => (
      <div className="font-mono text-sm font-semibold tracking-tight">
        {row.getValue("invoiceNumber")}
      </div>
    ),
  },

  // 2. Date
  {
    accessorKey: "invoiceDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.getValue("invoiceDate"))}
      </div>
    ),
  },

  // 3. Customer (derived from nested user object)
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original.user;
      const fullName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—";
      return (
        <div>
          <p className="text-sm font-medium leading-none">{fullName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        </div>
      );
    },
  },

  // 4. Total amount — backend sends string; Intl.NumberFormat for display
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const inv = row.original;
      return (
        <div className="font-semibold tabular-nums text-sm">
          {formatCurrency(inv.totalAmount, inv.currency)}
        </div>
      );
    },
  },

  // 5. Item type badges
  {
    id: "itemTypes",
    header: "Type",
    cell: ({ row }) => {
      const { hasPhysicalItems, hasDigitalItems } = row.original;
      return (
        <div className="flex gap-1 flex-wrap">
          {hasPhysicalItems && (
            <Badge variant="outline" className="text-xs">
              Physical
            </Badge>
          )}
          {hasDigitalItems && (
            <Badge variant="outline" className="text-xs">
              Digital
            </Badge>
          )}
        </div>
      );
    },
  },

  // 6. Status badge with per-status colouring
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <InvoiceStatusBadge status={row.getValue("status")} />
    ),
    filterFn: (row, id, filterValues: string[]) =>
      filterValues.length === 0 || filterValues.includes(row.getValue(id)),
  },

  // 7. Row actions
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open actions</span>
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(invoice.invoiceNumber);
                toast.success("Invoice number copied.");
              }}
            >
              <IconCopy className="mr-2 h-4 w-4" />
              Copy invoice #
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(invoice.id);
                toast.success("Invoice ID copied.");
              }}
            >
              <IconReceipt className="mr-2 h-4 w-4" />
              Copy ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
