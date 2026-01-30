import { Metadata } from 'next';
import { BooksListing } from '@/features/books/components/BooksListing';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Books Management | Admin Panel',
  description: 'Manage your book inventory',
};

export default function BooksPage() {
  return (
    <>
      <SiteHeader header="Books Listing" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <BooksListing />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
