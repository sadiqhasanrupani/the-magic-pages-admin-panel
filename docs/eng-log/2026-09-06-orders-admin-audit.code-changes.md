# Orders Admin Feature — Post-Build Audit & Fixes — Code Changes
_Date: 2026-09-06 · Author: frontend-architect-engineer · Related: `2026-08-30-orders-admin-feature.code-changes.md` (original build)_

## Summary

Audited the uncommitted Orders admin feature (`src/features/orders/**` and `src/app/(dashboard)/orders/**`) against the real backend contract — the NestJS DTOs, entities, and `OrdersService`/`PhysicalFulfillmentService` transition logic in the backend monolith. The feature was already close to production quality: every field name, casing, nullability, enum value, query param, mutation shape, and validation rule matches the backend exactly. Two real defects were found and fixed:

1. **A digital-only order could be offered "Mark shipped."** The backend never advances `fulfillment_status` past `NOT_STARTED` for an order with no physical line, so a paid digital-only order displays as `PROCESSING` forever — the same display status a genuinely-shippable physical order has. The UI's action-gating only looked at `order.status`, not at whether the order actually contains a physical item, so it would show "Mark shipped" on a digital order. The backend's own transition guard (`ALLOWED_FULFILLMENT_TRANSITIONS`) does not check for a physical line either, so this was not just a UX confusion — the PATCH would have actually succeeded, sending the customer a "your parcel shipped" e-mail for a book that was never printed.
2. **A failed order-list fetch was invisible.** `OrdersListing` destructured `data`/`isLoading`/`isFetching` from `useOrders` but never read `isError`, so a 403/500 on `GET /admin/orders` rendered identically to a genuinely empty list ("No orders found.") — an operator would misread "no orders" as ground truth and never a search a filter to fix.

No other defects were found. No restructuring was done; both fixes are small, additive, and match the surrounding idioms.

## Why / motivation

This was an audit task, not a build task: the feature was implemented in a prior session and is entirely uncommitted. The brief was to verify the frontend/backend contract field-by-field, check the fulfilment guard rails against the server's real state machine (not just the client's mirror of it), and confirm error/loading/empty states are operator-legible — then fix whatever is actually broken.

## Files changed

- `src/features/orders/components/OrderFulfillmentActions.tsx` — added a `hasPhysicalItems = order.items.some((item) => !item.isDigital)` check and AND'ed it into `canShip`. `canDeliver` needed no change: an order can only reach `SHIPPED` (a precondition for the delivered action) through this same gate now, so a digital-only order can never reach the delivered-eligible state either.
- `src/features/orders/components/OrdersListing.tsx` — destructured `isError`/`error` from `useOrders` and rendered a destructive `Alert` above the table (using the same `Alert`/`AlertTitle`/`AlertDescription` pattern already used in `OrderDetailView.tsx`'s 404/error state) when the list fetch fails. Distinguishes a 403 ("You don't have access to view orders") from any other failure ("Could not load orders"). The filter bar and table stay mounted underneath so a retry doesn't discard the admin's filters.
- Both edited files also had their import blocks reordered to satisfy the project's `assist/source/organizeImports` Biome rule (import-order only — no formatting/quote-style changes were made; see "How to test" for why).

## Key decisions & trade-offs

- **Gate on `order.items`, not a new field.** The alternative — asking the backend to add an `isPhysicalOrder` flag to `AdminOrderResponseDto` — is the cleaner long-term contract, but the response already carries everything needed (`items[].isDigital`, the same field the "Items" column in `order-columns.tsx` already uses to render its Physical/Digital badges) so a derived boolean is enough and needs no backend change. Follow-up recorded below.
- **Did not add a backend-side guard.** The backend repo is read-only reference for this task; `OrdersService.updateFulfillmentAdmin` does not check for a physical line before accepting a `SHIPPED` target. The frontend gate closes the *operator-facing* hole (nobody can click a button that shouldn't exist), but the endpoint itself would still accept a hand-crafted `PATCH` request for a digital-only order. That's a backend fix, out of scope here — flagged under Follow-ups.
- **Error banner is additive, not a state swap.** `OrderDetailView`'s error state *replaces* the page content because there's nothing else useful to show for one missing order. The list view keeps the filter bar and (now-empty) table mounted under the alert, because the fetch failure doesn't invalidate the admin's search/filter inputs and a retry (via the existing refresh button) should not force them to redo it.
- **Did not touch pre-existing lint/format drift.** `biome check` flags every file in this feature (and identically, every file in `src/features/invoices`, which is already-shipped code) for quote style (project code is single-quoted; `biome.json` has no `javascript.formatter.quoteStyle` override, so Biome's double-quote default disagrees with the entire codebase) and a couple of pre-existing `useImportType`/`noArrayIndexKey` items in files this audit did not otherwise touch. Rewriting quote style across 15 files, or diverging `OrderDataTable`'s skeleton-row keys from the identical pattern already in `InvoiceDataTable.tsx`, would be exactly the "restructure working code" this task said not to do. See the code-review doc for the itemized list.

## Component / data-flow changes

No new components, hooks, types, or query keys. `OrderFulfillmentActions` gained one local derived boolean (`hasPhysicalItems`); `OrdersListing` reads two more fields off the existing `useOrders()` return value. No API contract or query-key changes.

## How to test

```bash
cd the-magic-pages-admin-panel
npx tsc --noEmit -p tsconfig.json   # 0 errors under src/features/orders or the orders routes
npx biome lint src/features/orders/components/OrdersListing.tsx src/features/orders/components/OrderFulfillmentActions.tsx   # clean
```

Manual UI flow:
1. Open an order detail page for a **digital-only** order that is paid (displays "Processing"). Confirm neither the header buttons nor the row's `⋮` menu offer "Mark shipped".
2. Open an order detail page for a **physical** order in "Processing". Confirm "Mark shipped" is still offered and still works.
3. Simulate a list-fetch failure (e.g. temporarily point `NEXT_PUBLIC_API_BASE_URL` at a dead host, or stop the backend) and load `/orders`. Confirm a red "Could not load orders" alert renders above the (empty) table, rather than a bare "No orders found."

## Follow-ups

- Backend: `OrdersService.updateFulfillmentAdmin` has no guard against advancing a digital-only order to `SHIPPED`/`DELIVERED`. The frontend fix here closes the UI path; a hand-crafted API call could still do it. Worth a backend ticket to reject `SHIPPED` when the order has no physical line (`FULFILLMENT_INVALID_TRANSITION` or a new error code).
- The pre-existing Biome quote-style disagreement (whole codebase is single-quoted; `biome.json` implies double) is a repo-wide config gap, not an orders-specific issue — worth a separate cleanup task rather than folding it into feature work.
