"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Transaction, TransactionsService } from "@/services/transactions.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import { toast } from "sonner";

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "Transaction ID",
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "order.id",
    header: "Order ID",
    cell: ({ row }) => <div>#{row.original.order?.id}</div>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: row.original.currency || "INR",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "provider",
    header: "Provider",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("provider")}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (status === "SUCCESS") variant = "default"; // Greenish usually
      if (status === "FAILED") variant = "destructive";

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      return <div>{new Date(row.getValue("created_at")).toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;

      const handleRefund = async () => {
        try {
          toast.loading("Initiating refund...");
          await TransactionsService.refundTransaction(transaction.id);
          toast.success("Refund initiated successfully");
          // Ideally refresh data here
        } catch (error: any) {
          toast.error(`Refund failed: ${error.response?.data?.message || error.message}`);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Copy Transaction ID
            </DropdownMenuItem>
            {transaction.status === "SUCCESS" && (
              <DropdownMenuItem onClick={handleRefund} className="text-red-600">
                Refund Transaction
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
