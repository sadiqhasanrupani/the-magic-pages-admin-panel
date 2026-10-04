# Orders Admin Feature (Physical Fulfilment, Phase 2) — Code Changes
_Date: 2026-08-30 · Author: frontend-architect-engineer · Related: "Physical Tangible Asset Flow" plan, Phase 2 (Admin panel)_

## Summary

Built the admin panel's first Orders feature from scratch. Admins can now list and filter every order in the shop, open a single order, and advance its physical fulfilment state — marking it **Shipped** (capturing carrier and tracking details through a validated dialog) or **Delivered** (through a confirm). The feature consumes the three admin endpoints that shipped with Phase 1 of the backend, and follows the existing `src/features/invoices/` structure so it reads as a sibling of the features already in the repo.

Before this change the admin panel had no orders concept at all: `src/features/` held only `auth`, `books`, `age-groups`, `categories`, and `invoices`.

## Why / motivation

Physical orders had no lifecycle. The backend defaulted `fulfillment_status` to `NOT_STARTED` and nothing ever advanced it, so a printed book that a customer paid for sat in limbo forever — no way to record that it shipped, no carrier or tracking captured, no customer notification. Digital items already had a complete post-payment lifecycle (claim, delivery email, per-item status); physical items had none of it.

Phase 1 built the backend half of that state machine. This phase is the operator interface for it: without a screen to drive `PATCH /admin/orders/:id/fulfillment`, the endpoint has no caller and the gap stays open.

## Files changed

### New — domain and data layer
- `src/features/orders/types/orders.types.ts` — the full contract mirror: `Order`, `AdminOrder`, `OrderItem`, `OrderAddress`, `OrderCustomer`, the two status vocabularies (`FulfillmentStatus` for writes, `OrderDisplayStatus` for reads), `OrderQueryParams`, `UpdateFulfillmentPayload`, plus the `nextFulfillmentActions()` transition map.
- `src/features/orders/api/orders.api.ts` — `BASE_URL = '/admin/orders'`; `getOrders`, `getOrder`, `updateOrderFulfillment` (via `apiClient.patch`).
- `src/features/orders/hooks/useOrders.ts` — `orderKeys` query-key factory, `useOrders`, `useOrder`, `useUpdateOrderFulfillment`.
- `src/features/orders/utils/format.ts` — `formatPaise`, `formatDate`, `formatDateTime`, `isSafeHttpUrl`.
- `src/features/orders/schemas/fulfillment.schema.ts` — zod schema for the Mark-Shipped form.

### New — components
- `src/features/orders/components/OrderFulfillmentStatusBadge.tsx` — status → `{label, className}` map rendered as an outline `Badge`.
- `src/features/orders/components/OrderDataTable.tsx` — server-paginated TanStack table with skeleton rows and page-size control.
- `src/features/orders/components/order-columns.tsx` — order #, placed date, customer, items, total, status, tracking, row actions.
- `src/features/orders/components/OrderFulfillmentActions.tsx` — the single source of truth for which actions an order may take; renders as a dropdown (table) or inline buttons (detail).
- `src/features/orders/components/MarkShippedDialog.tsx` — react-hook-form + zod dialog capturing carrier, tracking number, optional tracking URL, optional note.
- `src/features/orders/components/MarkDeliveredDialog.tsx` — `AlertDialog` confirm for the terminal transition.
- `src/features/orders/components/OrdersListing.tsx` — page container: search, fulfilment filter, payment filter, refresh.
- `src/features/orders/components/OrderDetailView.tsx` — header, line items with money breakdown, shipment card, customer card, shipping address card.

### New — routes
- `src/app/(dashboard)/orders/page.tsx` — list route; server component setting `metadata`, rendering `<OrdersListing />`.
- `src/app/(dashboard)/orders/[id]/page.tsx` — detail route; Next 15 async `params: Promise<{id: string}>`.

### Modified
- `src/components/app-sidebar.tsx` — added an "Orders" nav entry (`IconPackage`, `/orders`) above "Invoices".

No `src/middleware.ts` change was needed: its matcher already covers every non-public path, so `/orders` is auth-gated by the existing cookie-presence check (verified — an uncookied request to `/orders` returns 307 to `/login`).

## Key decisions & trade-offs

**1. Deriving fulfilment actions from `status` instead of a `fulfillmentStatus` field.**
The task brief said `AdminOrderResponseDto` carries `paymentStatus` and `fulfillmentStatus`. Reading the actual DTO, it does not — it extends `OrderResponseDto`, which exposes only a single collapsed `status: OrderDisplayStatus`. The backend's `mapStatus()` folds the two stored axes into it: `CANCELLED` wins outright, any non-`PAID` payment becomes `PENDING`, and a paid order reports `PROCESSING` / `SHIPPED` / `DELIVERED` (with `NOT_STARTED` displayed as `PROCESSING`).

That collapsed value turns out to be sufficient to drive the UI, because the information loss is confined to distinctions that do not change the available action: `PENDING` means "not paid", which is exactly when the server returns 409 `FULFILLMENT_NOT_PAID`; and `NOT_STARTED` vs `PROCESSING` is invisible but irrelevant, since both accept the same next move (`SHIPPED`). So `nextFulfillmentActions()` maps display status → legal transitions and stays faithful to the server's guards.

*Alternative considered:* asking the backend to add explicit `paymentStatus`/`fulfillmentStatus` fields to the admin DTO. That is the cleaner contract and is recorded as a follow-up, but it was not required to ship, and inventing fields the API does not send would have been worse.

*Trade-off accepted:* an admin who filters by `fulfillmentStatus=NOT_STARTED` sees rows badged "Processing". Documented in `orders.types.ts` and in `OrdersListing`.

**2. A paise-specific currency formatter rather than reusing the invoices one.**
The brief said to reuse `invoice-columns.tsx`'s `formatCurrency`. That function takes a decimal rupee *string* (`"1499.00"`) because TypeORM serialises invoice numeric columns as strings. The orders contract sends **integer paise** (`149900`). Passing paise through the invoice formatter would render ₹149,900.00 — a 100× overstatement on every screen. `formatPaise` uses the identical `Intl.NumberFormat` config with the correct unit conversion. The reasoning is written into the file so nobody "de-duplicates" the two back together.

**3. Server `meta` as the single source of pagination truth.**
`InvoiceDataTable` mirrors pagination into local state and pushes it back to the parent through two `useEffect`s, which both fire on mount and leave the server response and local state competing. `OrderDataTable` derives everything from `meta` and calls the parent handlers directly from the buttons. Fewer renders, no reset loop, and the prev/next enabled states come from the server's own `hasNextPage`/`hasPreviousPage` rather than a recomputed guess.

**4. Dialogs hoisted out of the dropdown menu.**
A Radix `DropdownMenu` unmounts its content on close, which would destroy a dialog nested inside it at the very moment the menu item is clicked. The dialogs are rendered as siblings and driven by local state, and the menu items use `onSelect` + `preventDefault()` so the menu's own close does not race the dialog's mount.

**5. Actions centralised in one component.**
`OrderFulfillmentActions` is shared by the table row and the detail header via a `variant` prop, so the two surfaces cannot drift on which transitions they offer.

**6. Search commits on submit, not on keystroke.**
One request per search rather than one per character, without introducing a debounce timer.

## Component / data-flow changes

```
OrdersListing ──useOrders(params)──▶ GET /admin/orders ──▶ { data, meta }
     │                                                          │
     └─▶ OrderDataTable ◀── orderColumns ──▶ OrderFulfillmentActions
                                                     │
                              ┌──────────────────────┴─────────────────┐
                     MarkShippedDialog                        MarkDeliveredDialog
                              └──────── useUpdateOrderFulfillment ─────┘
                                                     │
                                  PATCH /admin/orders/:id/fulfillment
                                                     │
                          invalidate orderKeys.lists() + setQueryData(detail)

OrderDetailView ──useOrder(id)──▶ GET /admin/orders/:id ──▶ AdminOrder
```

**Query keys:** `orderKeys = { all: ['orders'], lists(), list(params), details(), detail(id) }`.

**Cache strategy on mutation success:** the server echoes the full updated order, so the detail cache is seeded with `setQueryData` (no second round-trip) while lists are *invalidated* — a status change can move a row in or out of the active filter, and only the server knows the resulting page composition.

**API contracts consumed:**
| Method | Path | Response |
|---|---|---|
| GET | `/admin/orders` | `{ data: AdminOrder[], meta }` |
| GET | `/admin/orders/:id` | `AdminOrder` |
| PATCH | `/admin/orders/:id/fulfillment` | `AdminOrder` |

Two envelope details worth flagging, both different from `/invoices`: these endpoints return **no `{ message, data }` wrapper**, and the pagination meta uses `{total, page, limit, totalPages, hasNextPage, hasPreviousPage}` rather than the invoices' `{itemsPerPage, totalItems, currentPage, totalPages}`. The types mirror the wire faithfully rather than normalising, so a backend change surfaces as a type error here.

## How to test

**Compile checks (both run clean for this feature):**
```bash
cd the-magic-pages-admin-panel
npx tsc --noEmit 2>&1 | grep -E "^src/(features/orders|app/\(dashboard\)/orders|components/app-sidebar)"   # → 0 results
npx next build --turbopack   # → "Compiled successfully"
```
Note: `next build`'s type-check stage currently fails on **pre-existing** errors in `src/features/books/components/BookTable.tsx:106` and `src/features/invoices/components/InvoiceForm.tsx` — both untouched by this work (confirmed via `git status`). Those must be fixed separately before the build is green end-to-end.

**Route smoke test (no backend needed):**
```bash
npx next dev --turbopack -p 3499
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3499/orders                                  # 307 → /login
curl -s -H "Cookie: accessToken=x" -o /dev/null -w "%{http_code}\n" http://localhost:3499/orders       # 200
curl -s -H "Cookie: accessToken=x" -o /dev/null -w "%{http_code}\n" http://localhost:3499/orders/42    # 200
```

**Full UI walk-through (requires a running backend + admin credentials):**
1. Log in as an admin; confirm "Orders" appears in the sidebar and links to `/orders`.
2. On `/orders`: confirm rows load, totals read as sane rupee amounts (**not** 100× too large), and pagination/page-size work.
3. Search `MP-000042`, then a bare `42`, then a customer email substring — each should narrow the list.
4. Set Fulfilment = `PROCESSING` and Payment = `PAID` to get the real ship queue.
5. On a paid, unshipped order: row menu → **Mark shipped**. Submit empty → inline "Carrier is required." Enter carrier + tracking, submit → success toast, dialog closes, badge flips to Shipped, tracking column populates.
6. On that order: **Mark delivered** → confirm → badge flips to Delivered and both actions disappear.
7. Open an order detail; verify line items, the Items-subtotal / Shipping / Total breakdown, the shipment card (carrier, tracking, timestamps, working tracking link), and that the same actions are available here.
8. On an unpaid order: confirm no fulfilment actions appear and the "Payment not settled" alert explains why.

## Follow-ups

- **Ask backend to expose `paymentStatus` and `fulfillmentStatus` explicitly on `AdminOrderResponseDto`.** The collapsed `status` works today, but the admin panel is reconstructing state the server already knows, and the NOT_STARTED-shows-as-Processing wrinkle is a real (if minor) operator confusion. This is the cleanest fix.
- **Pre-existing type errors block `next build`** (`BookTable.tsx`, `InvoiceForm.tsx`). Not in scope here, but the build cannot go green until they are resolved.
- **No live backend smoke test was performed** — verification was compile-cleanliness plus route-render only. The mutation path (success toast, cache invalidation, badge flip, 409 handling) has not been exercised against real data.
- **No automated tests.** The repo has no test runner configured; `nextFulfillmentActions()` and `formatPaise()` are pure functions and would be the natural first unit tests if one is added.
- **Sorting is display-only.** Columns render sort affordances but `GET /admin/orders` accepts no `sortBy`/`sortOrder`; the list is always newest-first. Either wire up backend sort params or drop the affordance.
