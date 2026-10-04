# Orders Admin Feature (Physical Fulfilment, Phase 2) — Code Review (self-review)
_Date: 2026-08-30 · Reviewer: frontend-architect-engineer_

## Scope reviewed

Everything added or changed for the Orders feature:

- `src/features/orders/types/orders.types.ts`
- `src/features/orders/api/orders.api.ts`
- `src/features/orders/hooks/useOrders.ts`
- `src/features/orders/utils/format.ts`
- `src/features/orders/schemas/fulfillment.schema.ts`
- `src/features/orders/components/` — `OrderFulfillmentStatusBadge`, `OrderDataTable`, `order-columns`, `OrderFulfillmentActions`, `MarkShippedDialog`, `MarkDeliveredDialog`, `OrdersListing`, `OrderDetailView`
- `src/app/(dashboard)/orders/page.tsx`, `src/app/(dashboard)/orders/[id]/page.tsx`
- `src/components/app-sidebar.tsx` (nav entry only)

Reviewed against the actual backend contract as it exists on disk (`libs/contract/src/orders/dtos/`, `orders-admin.controller.ts`, `orders.service.ts`), not against the summary in the task brief — the two disagreed, and the code is written to the former.

## Findings

### 🔴 Blocker
None at this severity.

### 🟠 Should-fix

**1. Client-side sorting would have silently misrepresented the data — fixed during review.**
*Where:* `OrderDataTable.tsx` (table config), `order-columns.tsx` (Placed / Total headers).
`DataTableColumnHeader` renders a working Asc/Desc control, and the table was configured with `getSortedRowModel()`. Combined with `manualPagination: true` and an endpoint that accepts no `sortBy`/`sortOrder`, clicking "Total → Desc" would have sorted only the 20 rows on the current page while presenting itself as a sort over all 137. That is a correctness problem, not a cosmetic one: an operator would reasonably read the top row as the largest order in the shop.
*Fix applied:* set `enableSorting: false` and dropped `getSortedRowModel()` and the sorting state. `DataTableColumnHeader` already degrades to a plain label when `getCanSort()` is false, so the headers still render. Re-enable once the endpoint supports sort params. **Worth noting: `InvoiceDataTable` has this same latent issue and was not touched here.**

**2. Response DTO lacks the fields the UI logically needs; action gating is reconstructed.**
*Where:* `orders.types.ts:nextFulfillmentActions`, keyed on `OrderDisplayStatus`.
`AdminOrderResponseDto` exposes only a collapsed `status`, not `paymentStatus`/`fulfillmentStatus`. The derivation is sound — `PENDING` is exactly the unpaid case the server 409s on, and `NOT_STARTED`/`PROCESSING` accept the same next move — so the UI never offers an action the server would reject. But the frontend is reconstructing state the backend already has, and the mapping is only correct for as long as `mapStatus()` keeps its current shape. A `mapStatus` change would break the gating silently, with no type error.
*Suggested fix:* ask backend to add both fields explicitly to `AdminOrderResponseDto`. Tracked as the top follow-up in the changes doc.

**3. Filter vocabulary and displayed vocabulary differ.**
*Where:* `OrdersListing.tsx` (Fulfilment filter) vs the Status column.
Filtering by `NOT_STARTED` returns rows badged "Processing", because the filter queries the stored column while the badge shows the collapsed display status. Accurate to the contract, but momentarily confusing. Documented in both files; resolved for free if finding #2 is addressed.

### 🟢 Nit

**4. Per-row dialog components mount even while closed.**
*Where:* `OrderFulfillmentActions.tsx` — `dialogs` renders whenever `canShip`/`canDeliver`, regardless of open state.
At `limit=50` that is up to 50 `useForm` + `zodResolver` instances alive in a list where at most one dialog is ever open. Radix portals render nothing while closed, so there is no DOM cost, only hook-init cost. Left as-is deliberately: gating on `open` would unmount mid-close and lose the exit animation, for a saving that is not measurable at these row counts. Revisit if page size grows.

**5. `React.MouseEvent` used as a type without importing React.**
*Where:* `MarkDeliveredDialog.tsx:41`.
Resolves via the global `React` namespace from `@types/react` and typechecks cleanly, but an explicit `import type { MouseEvent } from 'react'` would be more honest about the dependency.

**6. Items subtotal is derived by subtraction.**
*Where:* `OrderDetailView.tsx` — `order.total - order.shippingCost`.
Correct given the contract's guarantee that `shippingCost` is already inside `total`, and it is the only way to get a subtotal since the API sends no `subtotal` field. If data ever violates that invariant the line renders negative rather than throwing. Acceptable — a visibly wrong number beats a hidden one.

## Checklist

**Correctness & API contract alignment.** Verified field-by-field against the DTOs on disk rather than the task brief, which was wrong in three places: it claimed `paymentStatus`/`fulfillmentStatus` exist on the response (they do not), implied a `{message, data}` envelope (these endpoints return bare payloads), and implied the invoices `PaginationMeta` shape (orders use `total`/`page`/`limit`/`hasNextPage`/`hasPreviousPage`). Types mirror the wire exactly, so a backend change surfaces as a type error. `UpdateFulfillmentPayload` matches `UpdateOrderFulfillmentDto` including the conditional carrier/tracking requirement. Optional empty strings are collapsed to `undefined` at submit so the server's `@IsUrl`/`@MaxLength` see an absent key rather than `''`.

**Accessibility.** Icon-only buttons carry `sr-only` text (pagination, refresh, row-actions trigger, which names its order). All decorative icons are `aria-hidden`. Filter `Select`s are `aria-labelledby` their visible label; the search input has an `sr-only` `<label>`. The result-count line is `aria-live="polite"` so page changes are announced. The external tracking link has `rel="noopener noreferrer"` and an `sr-only` "(opens in a new tab)". Dialogs use Radix `Dialog`/`AlertDialog`, which handle focus trap, restore, and Escape. *Gap:* the data table has no `<caption>`, and the status badge conveys state by colour plus text (text is present, so this passes, but the colour alone is not a differentiator).

**Performance.** `placeholderData` keeps the previous page visible during fetch, avoiding a skeleton flash on paging. Mutation success seeds the detail cache with `setQueryData` (no refetch) and invalidates only `orderKeys.lists()`, not `orderKeys.all`. Search commits on submit rather than per keystroke — one request per search. Pagination reads straight from server `meta` with no local mirror, removing the double-effect render the invoices table incurs on mount. Known cost: finding #4.

**State management.** Clean split. All server state lives in TanStack Query behind the `orderKeys` factory; UI state (`page`, `limit`, filters, `searchInput`, dialog open flags) is local `useState`. No server data is copied into component state, so there is nothing to go stale. Dialog open state is deliberately local to `OrderFulfillmentActions` rather than lifted, since no other component needs it.

**Loading / empty / error states.** List: skeleton rows sized to the page limit, and a "No orders found." empty row. Detail: a full-page skeleton mirroring the real layout, plus a distinct error branch that separates 404 ("No order exists with id X") from a generic fetch failure. Mutations: buttons disable and show a spinner while pending; `MarkShippedDialog` stays open on failure with values intact so the admin can correct and retry, rather than discarding typed input. Server errors surface as toasts using the server's own message, so 409 `FULFILLMENT_NOT_PAID` / `FULFILLMENT_INVALID_TRANSITION` and 400 validation arrays all read correctly with no per-code branching. 401 routes to `handleUnauthorized()`, matching every other feature. An unpaid order additionally gets an inline alert explaining *why* no actions are offered, rather than just hiding them.

**Type safety.** No `any` anywhere in the feature. Error objects are narrowed through `unknown` + a local shape assertion, matching the `useInvoices` house pattern. Status vocabularies are string-literal unions, and `nextFulfillmentActions` is backed by a `Record<OrderDisplayStatus, FulfillmentStatus[]>` so adding a display status becomes a compile error rather than a silent `undefined`. `isSafeHttpUrl` narrows before the `trackingUrl` cast at the anchor. `npx tsc --noEmit` reports **0 errors** across all new and modified files.

**Security.** `trackingUrl` is re-validated as http/https in `isSafeHttpUrl` before being rendered as an `href`, even though the server already enforces it — a `javascript:` value from a legacy row or a future write path that bypasses the DTO must not become an XSS sink. No `dangerouslySetInnerHTML`. Authorization is entirely server-side (`@Role(ADMIN)`), with no client-side role branching, consistent with the rest of the panel.

## Verdict

**Ship** — with the caveat that this has only been verified to compile and render, not to work.

The feature is type-clean, matches the real backend contract (including three places where the task brief did not), and handles loading, empty, and error paths on every surface. The one correctness bug found in review — misleading client-side sorting — was fixed rather than documented.

Two things gate calling this *done*: the mutation path has **not been exercised against a live backend**, so the success toast, cache invalidation, badge transition, and 409 handling are unproven in practice; and `next build` still fails on **pre-existing** type errors in `BookTable.tsx` and `InvoiceForm.tsx` that are outside this change but block a green build. Neither is a reason to hold the merge, but the live walk-through in the changes doc should be run before this is considered operator-ready.
