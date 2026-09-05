import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";

export const metadata = {
  title: "Create Invoice | Magic Pages Admin",
};

export default function CreateInvoicePage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground text-sm mt-1">
          New invoices are created in{" "}
          <strong className="text-foreground">Draft</strong> status. You
          can update the status after review.
        </p>
      </div>

      <InvoiceForm />
    </div>
  );
}
