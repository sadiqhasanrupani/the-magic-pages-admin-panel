'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconLoader2, IconTruck } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useUpdateOrderFulfillment } from '../hooks/useOrders';
import {
  DEFAULT_MARK_SHIPPED_VALUES,
  markShippedSchema,
  type MarkShippedFormValues,
} from '../schemas/fulfillment.schema';

interface MarkShippedDialogProps {
  /** Numeric order id as a string, e.g. `"42"`. */
  orderId: string;
  /** Display reference for the copy, e.g. `"MP-000042"`. */
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Collects carrier + tracking details and moves an order to SHIPPED.
 *
 * Why a dialog rather than a direct dropdown action: this transition sends a
 * customer-facing tracking e-mail, and the server hard-requires carrier and
 * trackingNumber for it. Firing it straight from the menu would guarantee a
 * 400 on every click, so the fields must be gathered first.
 */
export function MarkShippedDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: MarkShippedDialogProps) {
  const { mutate, isPending } = useUpdateOrderFulfillment();

  const form = useForm<MarkShippedFormValues>({
    resolver: zodResolver(markShippedSchema),
    defaultValues: DEFAULT_MARK_SHIPPED_VALUES,
  });

  // Reset on close so reopening for a different order never shows the previous
  // order's carrier still typed in.
  React.useEffect(() => {
    if (!open) form.reset(DEFAULT_MARK_SHIPPED_VALUES);
  }, [open, form]);

  const onSubmit = (values: MarkShippedFormValues) => {
    mutate(
      {
        id: orderId,
        payload: {
          fulfillmentStatus: 'SHIPPED',
          carrier: values.carrier,
          trackingNumber: values.trackingNumber,
          // Collapse the optional inputs' empty string to `undefined`: the
          // server's @IsUrl / @MaxLength would reject '' but ignores an absent key.
          trackingUrl: values.trackingUrl?.trim() || undefined,
          comment: values.comment?.trim() || undefined,
        },
      },
      {
        // Close only on success — on a 409/400 the dialog stays open with the
        // typed values intact so the admin can correct and retry. The error
        // toast comes from the mutation's shared onError.
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTruck className="h-5 w-5" aria-hidden="true" />
            Mark {orderNumber} as shipped
          </DialogTitle>
          <DialogDescription>
            The customer is e-mailed these tracking details, so double-check them
            before submitting.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Delhivery"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890123"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tracking URL{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://www.delhivery.com/track/package/1234567890123"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Linked directly in the customer&apos;s e-mail. Must start
                    with http:// or https://.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Internal note{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Handed to courier 4pm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Saved to the order&apos;s audit log. Not shown to the
                    customer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <IconLoader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Mark shipped
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
