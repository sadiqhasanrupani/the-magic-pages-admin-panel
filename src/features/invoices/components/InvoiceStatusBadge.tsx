import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '../types/invoices.types';

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-muted-foreground/30',
  },
  ISSUED: {
    label: 'Issued',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  PAID: {
    label: 'Paid',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  OVERDUE: {
    label: 'Overdue',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground line-through border-muted-foreground/20',
  },
  REFUNDED: {
    label: 'Refunded',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;

  return (
    <Badge variant="outline" className={cn('text-xs font-semibold', config.className)}>
      {config.label}
    </Badge>
  );
}
