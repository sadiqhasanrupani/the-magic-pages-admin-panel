import { apiClient } from '@/lib/api-client';
import type {
  AdminOrder,
  FindAllOrdersResponse,
  OrderQueryParams,
  UpdateFulfillmentPayload,
} from '../types/orders.types';

const BASE_URL = '/admin/orders';

/**
 * `GET /admin/orders` — paginated fulfilment queue.
 *
 * Returns the `{ data, meta }` envelope directly. Unlike `/invoices`, these
 * endpoints do not wrap their payload in a `{ message, data }` shell, so there
 * is no extra `.data` hop to unwrap beyond axios's own.
 */
export const getOrders = async (
  params?: OrderQueryParams,
): Promise<FindAllOrdersResponse> => {
  const { data } = await apiClient.get(BASE_URL, { params });
  return data;
};

/** `GET /admin/orders/:id` — returns the bare order, not an envelope. */
export const getOrder = async (id: string): Promise<AdminOrder> => {
  const { data } = await apiClient.get(`${BASE_URL}/${id}`);
  return data;
};

/**
 * `PATCH /admin/orders/:id/fulfillment` — advance the fulfilment state.
 *
 * Responds with the updated order, which the mutation seeds straight into the
 * detail cache. Rejects with 409 `FULFILLMENT_NOT_PAID` /
 * `FULFILLMENT_INVALID_TRANSITION` on an illegal move, and 400 when
 * carrier/trackingNumber are missing for a SHIPPED target.
 */
export const updateOrderFulfillment = async (
  id: string,
  payload: UpdateFulfillmentPayload,
): Promise<AdminOrder> => {
  const { data } = await apiClient.patch(`${BASE_URL}/${id}/fulfillment`, payload);
  return data;
};
