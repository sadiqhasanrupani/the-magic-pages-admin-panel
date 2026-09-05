'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';

import type { AdminOrder } from '../types/orders.types';
import { formatDate, formatPaise } from '../utils/format';
import { OrderFulfillmentStatusBadge } from './OrderFulfillmentStatusBadge';
import { OrderFulfillmentActions } from './OrderFulfillmentActions';

export const orderColumns: ColumnDef<AdminOrder>[] = [
  // 1. Order number — doubles as the link into the detail view
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="font-mono text-sm font-semibold tracking-tight hover:underline"
      >
        {row.getValue('orderNumber')}
      </Link>
    ),
  },

  // 2. Placed-on date. The field is `date`, not `createdAt`.
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Placed" />
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.getValue('date'))}
      </div>
    ),
  },

  // 3. Customer — name falls back to the email when the profile has no name
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const { customer } = row.original;
      return (
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none truncate">
            {customer?.name || '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {customer?.email || '—'}
          </p>
        </div>
      );
    },
  },

  // 4. Item count + a physical/digital hint, so the fulfilment queue can tell
  //    at a glance whether a row is even shippable.
  {
    id: 'items',
    header: 'Items',
    cell: ({ row }) => {
      const items = row.original.items ?? [];
      const units = items.reduce((sum, item) => sum + Number(item.quantity), 0);
      const hasPhysical = items.some((item) => !item.isDigital);
      const hasDigital = items.some((item) => item.isDigital);

      return (
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums">{units}</span>
          <div className="flex gap-1 flex-wrap">
            {hasPhysical && (
              <Badge variant="outline" className="text-xs">
                Physical
              </Badge>
            )}
            {hasDigital && (
              <Badge variant="outline" className="text-xs">
                Digital
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },

  // 5. Total — integer paise on the wire
  {
    accessorKey: 'total',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="font-semibold tabular-nums text-sm">
          {formatPaise(order.total, order.currency)}
        </div>
      );
    },
  },

  // 6. Status
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <OrderFulfillmentStatusBadge status={row.original.status} />
    ),
  },

  // 7. Tracking — only meaningful once shipped
  {
    id: 'tracking',
    header: 'Tracking',
    cell: ({ row }) => {
      const { carrier, trackingNumber } = row.original;
      if (!carrier && !trackingNumber) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <div className="min-w-0">
          <p className="text-sm leading-none truncate">{carrier ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
            {trackingNumber ?? '—'}
          </p>
        </div>
      );
    },
  },

  // 8. Row actions
  {
    id: 'actions',
    cell: ({ row }) => <OrderFulfillmentActions order={row.original} />,
  },
];
