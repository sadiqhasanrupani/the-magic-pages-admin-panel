import { Metadata } from 'next';
import { EditBookForm } from '@/features/books/components/EditBookForm';

export const metadata: Metadata = {
  title: 'Edit Book | Admin Panel',
  description: 'Edit book details',
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBookPage(props: PageProps) {
  const params = await props.params;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <EditBookForm bookId={params.id} />
    </div>
  );
}
