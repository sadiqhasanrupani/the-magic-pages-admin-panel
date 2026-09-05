import { OrdersListing } from '@/features/orders/components/OrdersListing';

export const metadata = {
  title: 'Orders | Magic Pages Admin',
  description: 'Track and fulfil customer orders.',
};

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <OrdersListing />
    </div>
  );
}
