import { Metadata } from 'next';

import { OrderDetailView } from '@/features/orders/components/OrderDetailView';

export const metadata: Metadata = {
  title: 'Order Details | Magic Pages Admin',
  description: 'View and fulfil a customer order.',
};

interface PageProps {
  // Next 15: route params are async and must be awaited before use.
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage(props: PageProps) {
  const params = await props.params;

  return (
    <div className="flex flex-col gap-6 p-6">
      <OrderDetailView orderId={params.id} />
    </div>
  );
}
