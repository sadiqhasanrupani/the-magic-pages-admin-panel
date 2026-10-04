# Category CRUD (list / create / edit / delete) — Code Review (self-review)
_Date: 2026-08-30 · Reviewer: frontend-architect-engineer_

## Scope reviewed

Everything added or changed for the Categories feature:

- `src/features/categories/types/categories.types.ts`
- `src/features/categories/api/categories.api.ts`
- `src/features/categories/hooks/useCategories.ts`
- `src/features/categories/utils/categories.utils.ts`
- `src/features/categories/components/CategoryTable.tsx`
- `src/features/categories/components/CategoryForm.tsx`
- `src/features/categories/components/CategoriesListing.tsx`
- `src/app/(dashboard)/categories/{page,create/page,[id]/page}.tsx`
- `src/components/app-sidebar.tsx` (nav entry only)

Out of scope: the pre-existing type errors in `InvoiceForm.tsx` and `books/components/BookTable.tsx`,
which are unchanged and present on a clean tree.

## Findings

### 🔴 Blocker

**The `parent_id` field may not actually nest anything, and the failure is silent.**
Where: backend `libs/contract/src/books/entities/categories.entity.ts:18-24`, consumed by
`CategoryForm.tsx` (parent select) and `CategoryTable.tsx` (child rows).

The entity declares `@ManyToOne(() => Category, ...) parent?: Category` with **no `@JoinColumn`**,
alongside a separate `@Column({ type: 'uuid' }) parent_id?: string`. With TypeORM's default naming
strategy (this project sets no custom `namingStrategy`), the relation's foreign key is `parentId` —
a *different* column from `parent_id`.

If that reading is correct, then:
- `POST /categories` with `parent_id` writes the standalone `parent_id` column and never populates
  the relation;
- `findAll`'s `where.parent = IsNull()` filters on `parentId`, which is always null, so **every**
  category is returned as top-level;
- `relations: ['children']` joins on `parentId`, so `children` is **always empty**.

Net effect: the parent dropdown appears to work, saves without error, and simply does nothing
observable. The expand/collapse chevrons would never appear.

Why it matters: this is the one part of the feature that fails without any error signal, which is
the worst failure mode — an admin would assume they mis-used the UI.

Suggested fix: verify against the live schema first (`\d categories` — check whether both `parentId`
and `parent_id` columns exist). If confirmed, the fix is backend-side and one line:
`@ManyToOne(...) @JoinColumn({ name: 'parent_id' }) parent?: Category;` with the standalone
`@Column` kept as the exposed FK. **This is out of scope for this admin-panel task and was not
changed here** — flagging it so it is verified before the nesting capability is presented to the
client. I could not confirm it directly: no database or backend was running during this work.

The rest of the feature (create, rename, slug, age group, delete, list) is unaffected and works
regardless of how this resolves.

### 🟠 Should-fix

**No pagination; the list is silently truncated at 100.**
Where: `CategoryTable.tsx:56` and `CategoryForm.tsx:88` — both call `useCategoriesQuery({ limit: 100 })`.
The API returns a `meta` block (now correctly typed) that the UI ignores entirely. Beyond 100
top-level categories, rows vanish from the list with no indication, and the parent dropdown and the
duplicate-name check both quietly operate on partial data. This mirrors `BookTable`'s existing
`limit: 50`, so it is consistent with the codebase rather than a regression — but it is a real
ceiling. Suggested fix: render `meta.totalPages` and add a pager, or at minimum show a "showing X of
Y" hint when `totalItems > itemsPerPage`.

**Editing a category by direct URL fails if it is outside the first page.**
Where: `CategoryForm.tsx:190-200`. Because there is no `GET /categories/:id`, the edit screen can
only resolve categories present in the loaded list, and otherwise renders "Category not found" —
which is indistinguishable from a genuinely deleted category. Suggested fix: once the backend gains
a by-id route (or if `findBySlug` is made to accept a UUID), switch to a real detail fetch. Until
then the copy at least explains the pagination caveat.

**A category with children can be assigned a parent, creating depth the table cannot render.**
Where: `CategoryForm.tsx:137-141`. `parentOptions` excludes only the category itself. Nesting a
parent under another parent produces a grandchild level that `CategoryTable` does not display, so
those categories would disappear from the tree view. Suggested fix: disable the parent select (with
an explanatory hint) when the category being edited has children.

**Every 500 is reported as a probable duplicate name.**
Where: `useCategories.ts:50-52`. The duplicate-name case is the known cause of a 500 here, but a
genuine server fault would get the same message. The wording hedges ("may already exist"), so it
misleads rather than lies. Suggested fix: revisit once the backend catches `QueryFailedError` and
returns a 409.

### 🟢 Nit

- `AgeCategoryParams` in `categories.types.ts:79` is a deprecated alias retained for compatibility,
  but nothing imports it any more. It can be deleted.
- `CategoryTable.tsx:210` sets `aria-expanded` on the chevron button but has no `aria-controls`
  pointing at the child rows, and the child `<TableRow>`s are siblings rather than a grouped region.
  A screen-reader user gets the expanded/collapsed state but no programmatic association. Acceptable
  for a table of this size; worth revisiting if the tree deepens.
- In edit mode `slugManuallyEdited` is initialised to `true`, so renaming an existing category never
  re-suggests a slug. Deliberate — silently changing a live URL on rename would break shared links —
  but it does mean a renamed category keeps its old slug unless the admin notices.
- The delete dialog stays open when the mutation fails, so the admin can retry. Intentional, but it
  relies on the toast to explain why nothing happened.

## Checklist

**Correctness & API contract alignment:** Verified field-by-field against the NestJS source rather
than assumed — `create-category.dto.ts`, `categories.service.ts`, `categories.entity.ts` and both
controllers. Three contract mismatches were found and fixed: the missing `meta` on `FindAllResponse`,
`children` typed as `string[]` when the API returns `Category[]`, and `search`/`status` query params
that the endpoint does not implement. `slug`, `age_group` and `parent_id` are now typed
`string | null` rather than `string`, since all three are nullable columns — a small deviation from
the brief, which described the existing `Category` interface as already correct.

**Accessibility:** Icon-only buttons carry `aria-label`s naming the category they act on ("Actions
for Picture Books"), so the action menus are distinguishable out of context. Expand toggles expose
`aria-expanded`. Dialog focus-trapping and the select/form label associations come from Radix and the
existing `form.tsx` primitives. Gap noted above re: `aria-controls`.

**Performance:** One list query backs the table, the parent dropdown, the edit form's data source and
the duplicate check — no per-row or per-screen refetching, and navigating list → edit hits cache. The
age-group id→label map and the derived parent options are memoised. Children come embedded in the
list response, so expanding a row is pure local state. All mutations invalidate `categoryKeys.lists()`.

**State management:** Clean split. Server state lives entirely in TanStack Query; UI state
(`expandedIds`, `categoryToDelete`, `slugManuallyEdited`) is local component state and never mirrors
server data. Nothing is copied out of the query cache into `useState`.

**Loading / empty / error states:** The table has all three plus a distinct "Missing slug" badge for
the storefront-invisible case. The form has loading, error and not-found gates in edit mode. The
empty state is written to prompt the next action rather than just stating emptiness.

**Type safety:** No `any` anywhere in the new code — notable since the file this was copied from used
`(error: any)` in all three mutation handlers. The single cast is
`(error ?? {}) as AxiosError<ApiErrorBody>` in `getErrorMessage`, narrowing TanStack's `unknown`; the
nullish guard means it is safe when `error` is not an axios error. Query params, payloads and
responses are all explicitly typed against the verified backend contract.

## Verdict

**Ship** — the CRUD the client actually asked for (create and manage categories, with slugs that make
them reachable from the storefront) is complete, type-checked, lint-clean and smoke-tested, and it
degrades gracefully if the 🔴 parent-nesting question resolves badly: categories would simply all
appear top-level rather than breaking. That one finding should be verified against the live schema
before nesting is described to the client as working.
