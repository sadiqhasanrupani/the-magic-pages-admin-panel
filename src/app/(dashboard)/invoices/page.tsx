import { InvoiceListing } from "@/features/invoices/components/InvoiceListing";

export const metadata = {
  title: "Invoices | Magic Pages Admin",
  description: "Manage and track all customer invoices.",
};

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <InvoiceListing />
    </div>
  );
}
