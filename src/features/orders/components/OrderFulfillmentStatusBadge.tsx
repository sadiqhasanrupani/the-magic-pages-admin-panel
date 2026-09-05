import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  FulfillmentStatus,
  OrderDisplayStatus,
} from '../types/orders.types';

interface StatusConfig {
  label: string;
  className: string;
}

/**
 * One config map covering both status vocabularies.
 *
 * The API returns `OrderDisplayStatus` ('PENDING' | 'PROCESSING' | 'SHIPPED' |
 * 'DELIVERED' | 'CANCELLED') while the filter dropdown and the write payload
 * speak `FulfillmentStatus` ('NOT_STARTED' | …). The two overlap on four
 * members and differ only on PENDING vs NOT_STARTED, so a single keyed record
 * renders both without a second component.
 */
const STATUS_CONFIG: Record<
  OrderDisplayStatus | FulfillmentStatus,
  StatusConfig
> = {
  PENDING: {
    label: 'Awaiting payment',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  NOT_STARTED: {
    label: 'Not started',
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
  },
  PROCESSING: {
    label: 'Processing',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  SHIPPED: {
    label: 'Shipped',
    className:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  DELIVERED: {
    label: 'Delivered',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    className:
      'bg-muted text-muted-foreground line-through border-muted-foreground/20',
  },
};

interface OrderFulfillmentStatusBadgeProps {
  status: OrderDisplayStatus | FulfillmentStatus;
}

export function OrderFulfillmentStatusBadge({
  status,
}: OrderFulfillmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-semibold', config.className)}
    >
      {config.label}
    </Badge>
  );
}
