"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookTable } from "./BookTable";
import Header from "@/components/header";

export function BooksListing() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between w-full">
        <Header
          title={"Books"}
          description={`Manage your book catalog, prices, and variants.`}
          buttonText={"Add Book"}
          showButton={true}
          buttonHref="/admin/books/create"
        />
      </div>
      <BookTable />
    </div>
  );
}
