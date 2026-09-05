'use client';

import { IconLoader2 } from '@tabler/icons-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useUpdateOrderFulfillment } from '../hooks/useOrders';

interface MarkDeliveredDialogProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightweight confirm for the DELIVERED transition.
 *
 * DELIVERED carries no body fields, so this is a confirm rather than a form —
 * the same `AlertDialog` shape used for book deletion in `BookTable`. It is
 * still gated because the move is terminal (nothing transitions out of
 * DELIVERED) and it e-mails the customer.
 */
export function MarkDeliveredDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: MarkDeliveredDialogProps) {
  const { mutate, isPending } = useUpdateOrderFulfillment();

  const handleConfirm = (event: React.MouseEvent) => {
    // AlertDialogAction closes on click by default; prevent that so the dialog
    // stays up (with its spinner) until the request settles.
    event.preventDefault();
    mutate(
      { id: orderId, payload: { fulfillmentStatus: 'DELIVERED' } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark {orderNumber} as delivered?</AlertDialogTitle>
          <AlertDialogDescription>
            This e-mails the customer a delivery confirmation and closes the
            order&apos;s fulfilment. It cannot be undone from this panel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && (
              <IconLoader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Mark delivered
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
