# Category CRUD (list / create / edit / delete) — Code Changes
_Date: 2026-08-30 · Author: frontend-architect-engineer · Related: "client needs a UI to manage book categories"_

## Summary

Built the Categories feature end-to-end in the admin panel: a nested list screen, a shared
create/edit form, delete-with-confirmation, and a sidebar entry. The feature previously existed
only as a half-finished data layer — API functions, hooks and types were present but were
copy-pasted from the Books feature and never completed, and there was no screen of any kind. This
change finishes the data layer (fixing several genuine bugs in it) and adds the three routes and
three components that sit on top.

## Why / motivation

The backend has supported category CRUD for a while (`categories-admin.controller.ts`), and the
entire storefront browses the catalogue by category slug (`GET /categories/:slug`,
`GET /categories/:slug/books`). Until now there was no way for an admin to create a category at
all, so the storefront's primary navigation axis could only be populated by direct database
access.

## Files changed

**Data layer (fixes to existing files)**

- `src/features/categories/types/categories.types.ts` — replaced the empty `CreateCategoryPayload {}`
  stub with the real four-field payload; added `UpdateCategoryPayload`; added the missing `meta`
  block to `FindAllResponse`; corrected `Category.children` from `string[]` to `Category[]`;
  dropped the unsupported `search`/`status` query params; removed the empty `CreateCategoryDto`
  interface (that name belongs to the backend NestJS class).
- `src/features/categories/api/categories.api.ts` — removed `getCategory(id)`, which was broken by
  construction (see decisions below), and removed the unused `uploadFile` helper (categories have
  no file or image field). Documented the endpoints' real behaviour inline.
- `src/features/categories/hooks/useCategories.ts` — renamed the query-key factory `bookKeys` →
  `categoryKeys`; corrected every toast string from "Book" to "Category"; removed the dead
  `useCategoryQuery`; added a shared `getErrorMessage` helper so an opaque backend 500 renders as
  something actionable.

**New files**

- `src/features/categories/utils/categories.utils.ts` — `slugify`, `flattenCategories`,
  `findCategoryById`, `findCategoryByName`.
- `src/features/categories/components/CategoryTable.tsx` — the nested list table.
- `src/features/categories/components/CategoryForm.tsx` — shared create/edit form.
- `src/features/categories/components/CategoriesListing.tsx` — page-level wrapper.
- `src/app/(dashboard)/categories/page.tsx` — list route.
- `src/app/(dashboard)/categories/create/page.tsx` — create route.
- `src/app/(dashboard)/categories/[id]/page.tsx` — edit route.

**Other**

- `src/components/app-sidebar.tsx` — added a "Categories" nav entry (`IconCategory`, `/categories`)
  between Book and Orders.

## Key decisions & trade-offs

**The edit screen reads from the list, not from a detail endpoint.** The backend has no
`GET /categories/:id` — the only single-category route is `GET /categories/:slug`, so the previous
`getCategory(uuid)` would always 404. Rather than adding a fetch that cannot work, `CategoryForm`
resolves the category by id out of the cached `useCategoriesQuery()` result, flattening parents and
their embedded children. The list already returns every field the form binds to, so this costs
nothing. *Trade-off:* a category outside the first page of results cannot be edited by direct URL;
the form shows an explicit "Category not found" state rather than failing silently.

**`age_group` is a `<Select>` of real age groups, not free text.** See the age-groups note below.

**Slug is required in the UI even though it is optional on the backend DTO.** A category with no
slug is unreachable from the storefront, which makes it functionally invisible. The field is
auto-suggested from the name as the admin types and stops auto-updating the moment they edit it by
hand. *Alternative considered:* silently defaulting the slug on submit — rejected because the admin
should see the URL their category will live at before saving.

**Duplicate-name check is a soft warning, not a hard block.** The backend has a unique index on
`name` but does not catch the resulting `QueryFailedError`, so a duplicate surfaces as a bare 500.
The form warns inline when the typed name matches an already-loaded category, and the mutation's
error toast falls back to "A category with this name may already exist" on a 500. It cannot be a
hard block because the list is paginated — absence from the loaded page proves nothing.

**Plain table with expandable rows rather than a TanStack Table instance.** `BookTable.tsx` (the
reference implementation this was asked to mirror) uses the plain shadcn `Table` with manual row
mapping, not `@tanstack/react-table`. Introducing a second, divergent table paradigm for one screen
would cost more in consistency than it gains. The API already embeds one level of children per
top-level row, so expand/collapse is local state over data already in hand — no per-row fetching.

## Component / data-flow changes

```
/categories            → CategoriesListing → Header + CategoryTable
/categories/create     → CategoryForm  (create mode)
/categories/[id]       → CategoryForm  (edit mode, categoryId prop)
```

- **Query keys:** `categoryKeys.list(params)` → `['categories','list',params]`. The cache namespace
  was already `'categories'`, so the `bookKeys` → `categoryKeys` rename is purely cosmetic and does
  not invalidate any existing cached entry.
- **Invalidation:** all three mutations invalidate `categoryKeys.lists()`. There is no detail query
  to invalidate any more.
- **Shared query:** `CategoryTable` and `CategoryForm` both call `useCategoriesQuery({ limit: 100 })`,
  so navigating from list to edit reuses the cached list rather than refetching.
- **Cross-feature reuse:** both components consume `useAgeGroupsQuery()` from
  `src/features/age-groups/` — the table to render an age-group id as its human label, the form to
  populate the age-group select.

## How to test

```bash
npx tsc --noEmit          # should show only the pre-existing InvoiceForm/BookTable errors
npx biome check src/features/categories src/app/\(dashboard\)/categories   # clean
npm run dev
```

Then, with the backend running and logged in as an admin:

1. Open the sidebar — "Categories" appears between Book and Orders. Click it.
2. The list shows top-level categories. Rows with sub-categories have a chevron; expanding indents
   the children beneath the parent. A category saved without a slug renders a red "Missing slug"
   badge.
3. "Add Category" → type a name and watch the slug auto-fill in kebab-case. Edit the slug by hand,
   then change the name again — the slug should now stay put.
4. Type the name of a category that already exists — an inline duplicate warning appears, but the
   submit button stays enabled.
5. Pick an age group and a parent, save. You should land back on the list with a success toast.
6. Edit a category — the form should be pre-filled from the list with no additional network call.
   Its own name should not appear in its parent dropdown.
7. Delete a category that has sub-categories — the confirmation dialog must state that the N
   sub-categories will become top-level rather than being deleted.

**Not exercised:** the mutation paths were never run against a live backend in this session, so
create/update/delete are verified by contract-reading and typecheck only. The three routes were
smoke-tested against a dev server (all compiled and returned 200 with the expected content), but
with no API behind them.

## Follow-ups

- **Verify `parent_id` actually nests, backend-side.** See the 🔴 finding in the companion code
  review — there is a plausible column-mapping bug that would make nesting a silent no-op. This
  needs checking against the live schema before the parent dropdown is trusted.
- **Pagination.** The list is hardcoded to `limit: 100` with no pager, mirroring `BookTable`'s
  `limit: 50`. Fine for the expected number of categories, but the API returns `meta` and the UI
  ignores it.
- **Deep-linking to an out-of-page category** will show "Category not found" rather than fetching it.
- `AgeCategoryParams` is retained as a deprecated alias of `CategoryQueryParams`; nothing imports it
  and it can be deleted once confirmed unused.
