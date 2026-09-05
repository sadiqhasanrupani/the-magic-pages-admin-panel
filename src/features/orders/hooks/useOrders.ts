import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getOrder, getOrders, updateOrderFulfillment } from '../api/orders.api';
import type {
  OrderQueryParams,
  UpdateFulfillmentPayload,
} from '../types/orders.types';
import { handleUnauthorized } from '@/features/auth/utils/auth-handler';

// ── Query Key Factory ──────────────────────────────────────────────────────

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrderQueryParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ── Shared error handlers ──────────────────────────────────────────────────

const handleQueryError = (error: unknown) => {
  const err = error as { response?: { status?: number } };
  if (err.response?.status === 401) handleUnauthorized();
  throw error;
};

/**
 * Surface a failed mutation as a toast.
 *
 * The fulfilment endpoint's 409s (`FULFILLMENT_NOT_PAID`,
 * `FULFILLMENT_INVALID_TRANSITION`) and its 400s (missing carrier/tracking)
 * all carry a human-readable `message`, so no per-code branching is needed —
 * the server's wording is better than anything reconstructed from the code.
 * Nest's validation pipe sends `message` as an array, hence the join.
 */
const handleMutationError = (error: unknown) => {
  const err = error as {
    response?: { status?: number; data?: { message?: string | string[] } };
  };
  if (err.response?.status === 401) {
    handleUnauthorized();
    return;
  }
  const raw = err.response?.data?.message ?? 'An unexpected error occurred.';
  toast.error(Array.isArray(raw) ? raw.join(' · ') : raw);
};

// ── useOrders — paginated list ─────────────────────────────────────────────

export const useOrders = (params: OrderQueryParams = {}) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: async () => {
      try {
        return await getOrders(params);
      } catch (error) {
        handleQueryError(error);
        throw error;
      }
    },
    // Keep showing previous page data while the next page loads
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error: unknown) => {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// ── useOrder — single detail ───────────────────────────────────────────────

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      try {
        return await getOrder(id);
      } catch (error) {
        handleQueryError(error);
        throw error;
      }
    },
    enabled: !!id,
  });
};

// ── useUpdateOrderFulfillment — PATCH mutation ────────────────────────────

/**
 * Advance an order's fulfilment state.
 *
 * On success the server echoes the full updated order, so the detail cache is
 * seeded directly (`setQueryData`) rather than invalidated — the detail view
 * repaints with no second round-trip. Lists ARE invalidated, because a status
 * change can move a row in or out of the active filter and only the server
 * knows the new page composition.
 */
export const useUpdateOrderFulfillment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFulfillmentPayload;
    }) => updateOrderFulfillment(id, payload),
    onSuccess: (data) => {
      const label =
        data.status === 'SHIPPED'
          ? 'shipped'
          : data.status === 'DELIVERED'
            ? 'delivered'
            : 'updated';
      toast.success(`Order ${data.orderNumber} marked ${label}.`);

      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(data.id), data);
    },
    onError: handleMutationError,
  });
};
