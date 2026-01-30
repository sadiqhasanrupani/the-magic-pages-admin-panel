"use client";

import { useBookQuery } from "../hooks/useBooks";
import { BookForm } from "./BookForm";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EditBookFormProps {
  bookId: string;
}

export function EditBookForm({ bookId }: EditBookFormProps) {
  const { data: book, isLoading, error } = useBookQuery(bookId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[500px]" />
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load book details. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return <BookForm initialData={book} />;
}
