"use client";

import Header from "@/components/header";
import { CategoryTable } from "./CategoryTable";

export function CategoriesListing() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between w-full">
        <Header
          title={"Categories"}
          description={"Manage the categories customers browse the store by."}
          buttonText={"Add Category"}
          showButton={true}
          buttonHref="/categories/create"
        />
      </div>
      <CategoryTable />
    </div>
  );
}
