// Mirror of the backend orders contract — kept in sync with
// libs/contract/src/orders/dtos/{order-response,admin-order-response,
// order-admin-query,update-order-fulfillment}.dto.ts
//
// MONEY UNITS: every amount on this contract (`total`, `shippingCost`,
// `items[].price`) is an INTEGER IN PAISE, unlike the invoices feature where
// numeric columns arrive as decimal rupee strings. `shippingCost` is already
// included in `total` — render it as a breakdown line, never add it on top.

// ── Status vocabularies ────────────────────────────────────────────────────

/**
 * The stored fulfilment state, as the backend state machine models it.
 *
 * NOTE: this is the vocabulary of the *write* side — `UpdateFulfillmentPayload`
 * and the `fulfillmentStatus` query filter. It is deliberately NOT what comes
 * back on the response: see `OrderDisplayStatus`.
 */
export type FulfillmentStatus =
  | 'NOT_STARTED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

/** The stored payment state — a query filter only, not a response field. */
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

/**
 * What the API actually returns on `AdminOrderResponseDto.status`.
 *
 * The backend's `mapStatus()` collapses the two stored axes
 * (`payment_status` + `fulfillment_status`) into this single display value:
 *
 *   fulfillment CANCELLED                  -> 'CANCELLED'  (wins over everything)
 *   payment != PAID                        -> 'PENDING'    (incl. FAILED/REFUNDED)
 *   paid + NOT_STARTED | PROCESSING        -> 'PROCESSING'
 *   paid + SHIPPED                         -> 'SHIPPED'
 *   paid + DELIVERED                       -> 'DELIVERED'
 *
 * Two consequences the UI must respect:
 *  1. NOT_STARTED and PROCESSING are indistinguishable on the response. That is
 *     harmless in practice — settlement auto-advances a paid order to
 *     PROCESSING, and both states accept the same next move (SHIPPED).
 *  2. 'PENDING' means "not payable-complete", so it is never actionable. This is
 *     what lets `nextFulfillmentActions()` below mirror the server's guards
 *     without a separate `paymentStatus` field.
 */
export type OrderDisplayStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

/** Per-line digital delivery state. Always null on physical lines. */
export type DigitalDeliveryDisplayStatus =
  | 'PENDING'
  | 'SENDING'
  | 'DELIVERED'
  | 'FAILED';

// ── Value objects ──────────────────────────────────────────────────────────

/** Snapshot of the address captured at checkout. */
export interface OrderAddress {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  bookTitle: string;
  bookCover: string;
  format: string;
  quantity: number;
  /** Unit price in paise. */
  price: number;
  /** Branch on this rather than re-deriving physical/digital from `format`. */
  isDigital: boolean;
  deliveryStatus: DigitalDeliveryDisplayStatus | null;
  deliveredAt: string | null;
  /** Bearer-authed relative API path, or null. Not usable as a plain href. */
  downloadUrl: string | null;
}

/** The three customer fields the admin fulfilment queue needs. */
export interface OrderCustomer {
  id: number;
  email: string;
  /** First + last joined; empty string when the profile has neither. */
  name: string;
}

// ── Aggregate ──────────────────────────────────────────────────────────────

/** Mirrors `OrderResponseDto` — the shape the storefront also sees. */
export interface Order {
  id: string;
  orderNumber: string;
  /** ISO 8601 creation timestamp. Named `date`, not `createdAt`. */
  date: string;
  status: OrderDisplayStatus;
  /** Total in paise, shipping included. */
  total: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: OrderAddress | null;
  /** Shipping in paise. Already part of `total`. */
  shippingCost: number;
  /**
   * Tax in paise, INCLUSIVE — already part of `total`, like `shippingCost`.
   *
   * Recorded at checkout from the variant rates in force at the time of sale,
   * so it stays correct on an old order even after a rate is edited. `0` for an
   * untaxed basket and for orders predating the tax columns.
   */
  taxAmount: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

/** Mirrors `AdminOrderResponseDto` — everything above plus the buyer. */
export interface AdminOrder extends Order {
  customer: OrderCustomer;
}

// ── API response shapes ────────────────────────────────────────────────────

/**
 * Pagination envelope for `GET /admin/orders`.
 *
 * Note this does NOT match `invoices`' `PaginationMeta`
 * (`itemsPerPage`/`totalItems`/`currentPage`) — the orders endpoints use the
 * storefront's meta keys instead. Kept faithful to the wire rather than
 * normalised, so a backend change surfaces as a type error here.
 */
export interface OrdersPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** `GET /admin/orders` returns a bare `{ data, meta }` — no `message` key. */
export interface FindAllOrdersResponse {
  data: AdminOrder[];
  meta: OrdersPaginationMeta;
}

// ── Query params (match OrderAdminQueryDto exactly) ───────────────────────

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  fulfillmentStatus?: FulfillmentStatus;
  paymentStatus?: PaymentStatus;
  /** `MP-000042`, `42`, or a customer-email substring. */
  search?: string;
}

// ── Request payload (matches UpdateOrderFulfillmentDto exactly) ───────────

export interface UpdateFulfillmentPayload {
  fulfillmentStatus: FulfillmentStatus;
  /** Required by the server when `fulfillmentStatus === 'SHIPPED'`. */
  carrier?: string;
  /** Required by the server when `fulfillmentStatus === 'SHIPPED'`. */
  trackingNumber?: string;
  /** Optional; server validates it as an http/https URL. */
  trackingUrl?: string;
  /** Optional note recorded on the audit row. */
  comment?: string;
}

// ── Transition rules (mirror of the server-side state machine) ────────────

/**
 * The fulfilment moves an admin may make from a given *display* status.
 *
 * This mirrors `OrdersService.updateFulfillmentAdmin`'s guards so the UI only
 * offers buttons the server will accept. The server remains the authority — a
 * race (two admins, one order) still returns 409 and surfaces as a toast; this
 * map exists to keep the happy path from ever producing an obviously-invalid
 * request.
 *
 * 'PENDING' -> [] because the server refuses to fulfil an unpaid order
 * (409 FULFILLMENT_NOT_PAID), and 'PENDING' is precisely "not paid".
 * 'DELIVERED' and 'CANCELLED' are terminal.
 */
const ALLOWED_TRANSITIONS: Record<OrderDisplayStatus, FulfillmentStatus[]> = {
  PENDING: [],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** The legal next fulfilment states for an order in `status`. */
export const nextFulfillmentActions = (
  status: OrderDisplayStatus,
): FulfillmentStatus[] => ALLOWED_TRANSITIONS[status] ?? [];

/** True when the order has at least one action available. */
export const hasFulfillmentActions = (status: OrderDisplayStatus): boolean =>
  nextFulfillmentActions(status).length > 0;
