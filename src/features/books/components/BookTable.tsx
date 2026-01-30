"use client";

import { useBooksQuery, useBookMutation } from "../hooks/useBooks";
import { formatPriceForForm } from "../utils/transformers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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
import { useState } from "react";

export function BookTable() {
  const { data, isLoading } = useBooksQuery({ limit: 50, visibility: 'all' });
  const { deleteMutation } = useBookMutation();
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleDelete = async () => {
    if (bookToDelete) {
      await deleteMutation.mutateAsync(bookToDelete);
      setBookToDelete(null);
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

  const books = data?.data || [];

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Formats</TableHead>
              <TableHead className="text-right">Price Range</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {books.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No books found.
                </TableCell>
              </TableRow>
            ) : (
              books.map((book) => {
                const hasVariants = book.variants.length > 0;

                const prices = hasVariants
                  ? book.variants.map((v) => Number(v.price.amount))
                  : [];

                const minPrice = hasVariants ? Math.min(...prices) : null;
                const maxPrice = hasVariants ? Math.max(...prices) : null;

                const priceDisplay =
                  !hasVariants
                    ? "—"
                    : minPrice === maxPrice
                      ? formatCurrency(minPrice)
                      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;

                return (
                  <TableRow key={book.id}>
                    {/* Title */}
                    <TableCell className="font-medium">
                      {book.title}
                      {book.isBestseller && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Bestseller
                        </Badge>
                      )}
                    </TableCell>

                    {/* Author */}
                    <TableCell>{book.authorName}</TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          book.visibility === "public"
                            ? "default"
                            : book.visibility === "private"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {book.visibility}
                      </Badge>
                    </TableCell>

                    {/* Formats */}
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {hasVariants ? (
                          book.variants.map((v) => (
                            <Badge
                              key={v.id}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {v.format}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Price Range */}
                    <TableCell className="text-right">
                      {priceDisplay}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem asChild>
                            <Link href={`/admin/books/${book.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setBookToDelete(book.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently soft-delete the book
              and hide it from the public store.
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
