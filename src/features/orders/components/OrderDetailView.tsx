'use client';

import Link from 'next/link';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconExternalLink,
} from '@tabler/icons-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useOrder } from '../hooks/useOrders';
import type { AdminOrder } from '../types/orders.types';
import {
  formatDateTime,
  formatPaise,
  isSafeHttpUrl,
} from '../utils/format';
import { OrderFulfillmentActions } from './OrderFulfillmentActions';
import { OrderFulfillmentStatusBadge } from './OrderFulfillmentStatusBadge';

interface OrderDetailViewProps {
  orderId: string;
}

/** Small label/value pair used across the summary cards. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm mt-1 break-words">{children}</dd>
    </div>
  );
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { data: order, isLoading, isError, error } = useOrder(orderId);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !order) {
    const status = (error as { response?: { status?: number } } | null)?.response
      ?.status;
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>
            {status === 404 ? 'Order not found' : 'Could not load this order'}
          </AlertTitle>
          <AlertDescription>
            {status === 404
              ? `No order exists with id ${orderId}.`
              : 'Something went wrong fetching this order. Try refreshing the page.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header: reference, status, and the fulfilment actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {order.orderNumber}
            </h1>
            <OrderFulfillmentStatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Placed {formatDateTime(order.date)}
          </p>
        </div>

        <OrderFulfillmentActions order={order} variant="buttons" />
      </div>

      {/* Unpaid orders cannot be fulfilled — say so rather than just hiding the
          buttons, so the absent actions are explained. */}
      {order.status === 'PENDING' && (
        <Alert>
          <IconAlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Payment not settled</AlertTitle>
          <AlertDescription>
            This order cannot be fulfilled until payment succeeds. Fulfilment
            actions unlock automatically once it is paid.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: line items + totals */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-20 text-center text-muted-foreground"
                      >
                        This order has no line items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.bookTitle || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{item.format || '—'}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.isDigital ? 'Digital' : 'Physical'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPaise(item.price, order.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatPaise(
                            item.price * item.quantity,
                            order.currency,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              {/* `shippingCost` and `taxAmount` are both already inside `total`,
                  so they are shown as breakdown lines and the goods subtotal is
                  derived by subtracting shipping — never by adding either on
                  top. Tax is NOT subtracted: it is a slice of the goods price,
                  not a separate charge alongside it. */}
              <dl className="space-y-2 text-sm max-w-xs ml-auto">
                <div className="flex justify-between gap-8">
                  <dt className="text-muted-foreground">Items subtotal</dt>
                  <dd className="tabular-nums">
                    {formatPaise(
                      order.total - order.shippingCost,
                      order.currency,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-8">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="tabular-nums">
                    {formatPaise(order.shippingCost, order.currency)}
                  </dd>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between gap-8">
                    <dt className="text-muted-foreground">Tax (included)</dt>
                    <dd className="tabular-nums text-muted-foreground">
                      {formatPaise(order.taxAmount, order.currency)}
                    </dd>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between gap-8 font-semibold text-base">
                  <dt>Total</dt>
                  <dd className="tabular-nums">
                    {formatPaise(order.total, order.currency)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <ShipmentCard order={order} />
        </div>

        {/* Right: customer + shipping address */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <Field label="Name">{order.customer?.name || '—'}</Field>
                <Field label="E-mail">
                  {order.customer?.email ? (
                    <a
                      href={`mailto:${order.customer.email}`}
                      className="hover:underline"
                    >
                      {order.customer.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </Field>
                <Field label="Customer ID">
                  <span className="font-mono">{order.customer?.id ?? '—'}</span>
                </Field>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <address className="text-sm not-italic leading-relaxed">
                  <div>{order.shippingAddress.line1}</div>
                  {order.shippingAddress.line2 && (
                    <div>{order.shippingAddress.line2}</div>
                  )}
                  <div>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </div>
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.phone && (
                    <div className="mt-2 text-muted-foreground">
                      {order.shippingAddress.phone}
                    </div>
                  )}
                </address>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No shipping address — this is a digital-only order.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Carrier / tracking / timestamps. */
function ShipmentCard({ order }: { order: AdminOrder }) {
  const hasShipmentData =
    order.carrier || order.trackingNumber || order.shippedAt;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment</CardTitle>
      </CardHeader>
      <CardContent>
        {hasShipmentData ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Carrier">{order.carrier || '—'}</Field>
            <Field label="Tracking number">
              <span className="font-mono">{order.trackingNumber || '—'}</span>
            </Field>
            <Field label="Shipped at">{formatDateTime(order.shippedAt)}</Field>
            <Field label="Delivered at">
              {formatDateTime(order.deliveredAt)}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Tracking link">
                {isSafeHttpUrl(order.trackingUrl) ? (
                  <a
                    href={order.trackingUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Track this shipment
                    <IconExternalLink
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : (
                  '—'
                )}
              </Field>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            No shipment recorded yet. Marking this order shipped will capture the
            carrier and tracking number.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/orders">
        <IconArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Back to orders
      </Link>
    </Button>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
