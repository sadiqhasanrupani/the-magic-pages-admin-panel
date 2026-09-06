import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CategoryForm } from "@/features/categories/components/CategoryForm";

export const metadata: Metadata = {
  title: "Edit Category | Admin Panel",
  description: "Edit category details",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * `CategoryForm` resolves the category itself from the cached list query — the
 * backend has no `GET /categories/:id`, so there is nothing to prefetch here.
 */
export default async function EditCategoryPage(props: PageProps) {
  const params = await props.params;

  return (
    <>
      <SiteHeader header="Edit Category" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <CategoryForm categoryId={params.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
