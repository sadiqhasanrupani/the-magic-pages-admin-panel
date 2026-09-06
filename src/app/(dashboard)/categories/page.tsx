import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CategoriesListing } from "@/features/categories/components/CategoriesListing";

export const metadata: Metadata = {
  title: "Categories Management | Admin Panel",
  description: "Manage your book categories",
};

export default function CategoriesPage() {
  return (
    <>
      <SiteHeader header="Categories Listing" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <CategoriesListing />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
