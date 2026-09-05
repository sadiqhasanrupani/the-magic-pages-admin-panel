'use client';

import { IconAlertCircle, IconRefresh, IconSearch } from '@tabler/icons-react';
import * as React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useOrders } from '../hooks/useOrders';
import type {
  FulfillmentStatus,
  OrderQueryParams,
  PaymentStatus,
} from '../types/orders.types';
import { OrderDataTable } from './OrderDataTable';
import { orderColumns } from './order-columns';

const FULFILLMENT_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

/**
 * The admin fulfilment queue.
 *
 * Filters map 1:1 onto `OrderAdminQueryDto`. Note the filter dropdowns speak
 * the STORED vocabulary (`fulfillmentStatus` / `paymentStatus`) while the table's
 * Status column shows the COLLAPSED display status the response carries — so
 * filtering by NOT_STARTED yields rows badged "Processing". That is the
 * backend's `mapStatus` contract, not a bug here; see `orders.types.ts`.
 *
 * The default view is unfiltered rather than pre-set to the ship queue
 * (paid + processing), so an admin landing here sees the true order count and
 * is never confused by rows silently missing.
 */
export function OrdersListing() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [fulfillmentStatus, setFulfillmentStatus] = React.useState<
    FulfillmentStatus | undefined
  >();
  const [paymentStatus, setPaymentStatus] = React.useState<
    PaymentStatus | undefined
  >();

  // Two search states: what the admin is typing, and what is actually queried.
  // Committing on submit rather than on every keystroke keeps one request per
  // search instead of one per character, without a debounce timer.
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');

  const queryParams: OrderQueryParams = {
    page,
    limit,
    ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useOrders(queryParams);

  const hasFilters = !!fulfillmentStatus || !!paymentStatus || !!search;

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setFulfillmentStatus(undefined);
    setPaymentStatus(undefined);
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and fulfil customer orders.
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh orders"
        >
          <IconRefresh
            className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-end gap-3 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <label htmlFor="orders-search" className="sr-only">
            Search orders by number or customer e-mail
          </label>
          <Input
            id="orders-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="MP-000042 or customer@email.com"
            className="h-8 w-64"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8">
            <IconSearch className="mr-2 h-4 w-4" aria-hidden="true" />
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <span
            className="text-sm text-muted-foreground"
            id="orders-fulfillment-filter"
          >
            Fulfilment:
          </span>
          <Select
            value={fulfillmentStatus ?? 'ALL'}
            onValueChange={(value) => {
              setFulfillmentStatus(
                value === 'ALL' ? undefined : (value as FulfillmentStatus),
              );
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-8 w-40"
              aria-labelledby="orders-fulfillment-filter"
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {FULFILLMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-sm text-muted-foreground"
            id="orders-payment-filter"
          >
            Payment:
          </span>
          <Select
            value={paymentStatus ?? 'ALL'}
            onValueChange={(value) => {
              setPaymentStatus(
                value === 'ALL' ? undefined : (value as PaymentStatus),
              );
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-8 w-32"
              aria-labelledby="orders-payment-filter"
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {PAYMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={clearFilters}
          >
            Clear filters ×
          </Button>
        )}
      </div>

      {/* Fetch failure — shown above the table rather than in place of it, so
          the filter bar stays usable and a retry does not lose the admin's
          filters. A 401 never reaches here (the query's error handler
          redirects to /login first). */}
      {isError && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>
            {(error as { response?: { status?: number } } | null)?.response
              ?.status === 403
              ? "You don't have access to view orders"
              : 'Could not load orders'}
          </AlertTitle>
          <AlertDescription>
            Something went wrong fetching the order list. Try refreshing.
          </AlertDescription>
        </Alert>
      )}

      {/* Data table */}
      <OrderDataTable
        columns={orderColumns}
        data={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
}
