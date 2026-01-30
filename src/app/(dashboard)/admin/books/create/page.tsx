"use client";

import { SiteHeader } from "@/components/site-header";
import { BookForm } from "@/features/books/components/BookForm";

export default function CreateBookPage() {
  return (
    <>
      <SiteHeader header="Create Book" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <BookForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
