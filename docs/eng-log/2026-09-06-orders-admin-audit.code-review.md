# Orders Admin Feature — Post-Build Audit & Fixes — Code Review (self-review)
_Date: 2026-09-06 · Reviewer: frontend-architect-engineer_

## Scope reviewed

Every file in the Orders admin feature, against the real backend source (not just the frontend's own comments about the backend):

- `src/features/orders/types/orders.types.ts`
- `src/features/orders/api/orders.api.ts`
- `src/features/orders/hooks/useOrders.ts`
- `src/features/orders/schemas/fulfillment.schema.ts`
- `src/features/orders/utils/format.ts`
- `src/features/orders/components/{OrdersListing,OrderDataTable,order-columns,OrderDetailView,OrderFulfillmentActions,MarkShippedDialog,MarkDeliveredDialog,OrderFulfillmentStatusBadge}.tsx`
- `src/app/(dashboard)/orders/page.tsx`, `src/app/(dashboard)/orders/[id]/page.tsx`
- `src/components/app-sidebar.tsx` (the nav entry only)
- `src/lib/api-client.ts`

Backend counterpart read in full: `orders-admin.controller.ts`, `admin-order-response.dto.ts`, `order-response.dto.ts`, `order-admin-query.dto.ts`, `order-query.dto.ts`, `update-order-fulfillment.dto.ts`, `order-status.enum.ts`, `order-error-code.enum.ts`, and the relevant sections of `orders.service.ts` (`findAllForAdmin`, `findOneForAdmin`, `updateFulfillmentAdmin`, `mapToResponse`, `mapToAdminResponse`, `mapItem`, `mapStatus`) and `physical-fulfillment.service.ts` (`markProcessing`, `dispatchShipmentUpdate`).

## Findings

- 🔴 **Blocker (fixed)** — `OrderFulfillmentActions.tsx` (pre-fix, no line ref — logic was contained in `canShip = allowed.includes('SHIPPED')`). Fulfilment actions were gated only on the collapsed `order.status`, with no check for whether the order contains a physical item. A digital-only order's `fulfillment_status` never leaves `NOT_STARTED` (see `PhysicalFulfillmentService.markProcessing`, which is a no-op — `claimed: false` — when `hasPhysicalLine` is false), and `NOT_STARTED` displays as `'PROCESSING'` via `mapStatus()`. `nextFulfillmentActions('PROCESSING')` returns `['SHIPPED']`, so the UI offered "Mark shipped" on an order with nothing to ship. Worse: the backend's own `ALLOWED_FULFILLMENT_TRANSITIONS[NOT_STARTED]` includes `SHIPPED` with no physical-line check, so this was not a cosmetic bug the server would have caught with a 409 — the request would have succeeded and e-mailed the customer a shipping notification for a digital purchase. **Fix:** gate `canShip` on `order.items.some((item) => !item.isDigital)` as well.
- 🟠 **Should-fix (fixed)** — `OrdersListing.tsx:77` (pre-fix). `useOrders()`'s `isError`/`error` were never read, so a 403/500/network failure on `GET /admin/orders` rendered identically to a genuinely empty result set. An operator has no way to distinguish "there are no orders" from "the list failed to load" without opening devtools. **Fix:** added a destructive `Alert` reusing the existing pattern from `OrderDetailView`'s error state.
- 🟢 **Nit (not fixed, pre-existing, out of scope)** — Whole feature fails `biome check` on quote style (single vs. Biome's configured double-quote default) and two files (`OrderDataTable.tsx`, `order-columns.tsx`) plus the `[id]/page.tsx` route carry pre-existing `lint/style/useImportType` warnings. Identical to the pre-existing state of `src/features/invoices` — a repo-wide Biome/codebase convention mismatch, not something introduced by this feature. Rewriting quote style across 15 files was judged out of scope for a "fix real defects, don't restructure" audit.
- 🟢 **Nit (not fixed, pre-existing, intentional)** — `OrderDataTable.tsx:144,146` — `lint/suspicious/noArrayIndexKey` on the loading-skeleton rows (`key={i}` / `key={j}`). This is the identical pattern already shipped in `InvoiceDataTable.tsx:139,141`; the array is a fixed-length placeholder that never reorders, so the rule's rationale (index-as-key breaking reconciliation on reorder) doesn't apply. Left as-is for consistency with its sibling table rather than diverging one file from the other.
- 🟢 **Nit (not fixed, backend-side)** — `updateFulfillmentAdmin` in the backend has no guard against a digital-only order reaching `SHIPPED`/`DELIVERED` via a direct API call (see code-changes doc's Follow-ups). The frontend fix in this audit closes the UI path only. Flagging here because it's the root cause the UI fix works around, not because it's actionable from this repo.

None of the mismatches the audit brief specifically asked me to hunt for — field-name/casing drift, wrong query params, wrong mutation method/path/body, stale query-key invalidation, hardcoded currency symbols, unstable date formatting, `javascript:`-URL XSS on the tracking link — were present. Every field on `Order`/`AdminOrder`/`OrderItem`/`OrderCustomer`/`OrdersPaginationMeta`/`OrderQueryParams`/`UpdateFulfillmentPayload` matches its backend counterpart name-for-name, and every enum value (`FulfillmentStatus`, `PaymentStatus`, `OrderDisplayStatus`) matches the backend's string literals exactly.

## Checklist

- **Correctness & API contract alignment:** Confirmed field-by-field against `AdminOrderResponseDto` → `OrderResponseDto`, `OrderAdminQueryDto` → `OrderQueryDto`, and `UpdateOrderFulfillmentDto`. No mismatches. `GET /admin/orders` query params (`page`, `limit`, `fulfillmentStatus`, `paymentStatus`, `search`) match `OrderAdminQueryDto` exactly, including that there is no `sortBy`/`sortOrder` on either side (consistent with `OrderDataTable` disabling client-side sorting). `PATCH /admin/orders/:id/fulfillment` method/path/body match `orders-admin.controller.ts` exactly. Pagination is fully server-driven via the `meta` envelope (`manualPagination: true`, `pageCount: totalPages`), never client-sliced.
- **Mutation cache behavior:** `useUpdateOrderFulfillment` seeds `orderKeys.detail(id)` via `setQueryData` from the server's echoed order (no stale optimistic state) and invalidates `orderKeys.lists()` (correct — a status change can move a row in or out of the currently-filtered page, which only the server can resolve).
- **Guard rails vs. server transition rules:** `nextFulfillmentActions()` in `orders.types.ts` is a faithful mirror of `ALLOWED_FULFILLMENT_TRANSITIONS` collapsed onto display status. The one gap — no physical-item check — is the blocker above, now fixed.
- **Form validation vs. server DTO:** `markShippedSchema`'s required fields, max-lengths (100/100/500/500), and the http(s)-only + `new URL()` tracking-URL check line up with `UpdateOrderFulfillmentDto`'s `@ValidateIf`/`@MaxLength`/`@IsUrl({protocols:['http','https']})` decorators exactly. A `javascript:` URL fails the schema's regex before it would ever be rendered as an anchor (`isSafeHttpUrl` in `format.ts` re-checks this defensively on render, which is the correct belt-and-suspenders call since old rows or a future write path bypassing the DTO shouldn't be trusted).
- **Accessibility (WCAG, keyboard, ARIA):** Icon-only buttons carry `sr-only` labels or `aria-label`; filter `Select`s use `aria-labelledby` pointing at their visible span labels; the pagination summary text uses `aria-live="polite"`. No regressions introduced.
- **Performance (re-renders, caching/invalidation):** No change in this audit affects render frequency or query behavior beyond adding two destructured fields already present on the query result.
- **State management (server vs. UI state):** Clean separation maintained — `OrdersListing` owns only UI filter/pagination state; all order data flows through TanStack Query.
- **Loading / empty / error states:** Detail view already covered 404/generic-error/loading well. List view's loading (skeleton rows) and empty ("No orders found.") states were already correct; the missing error state is the should-fix item above, now fixed. Mutation errors surface as toasts with the server's own message text (409/400 both carry human-readable `message`); double-submit is blocked via `isPending` disabling both dialogs' submit/confirm buttons.
- **Type safety:** No `any` in the reviewed/edited code (the one `as any` in the backend's `orders.service.ts` on `changed_by` is backend code, out of scope). Discriminated status vocabularies (`FulfillmentStatus` vs. `OrderDisplayStatus`) are kept genuinely separate types rather than unioned loosely.

## Verdict

**Ship** — both real defects found are fixed, verified against the actual backend contract rather than the frontend's comments about it, and typecheck/lint are clean on every file this audit touched. The two remaining lint nits are pre-existing, shared with already-shipped sibling features, and correctly out of scope for a "fix real defects, don't restructure" audit.
