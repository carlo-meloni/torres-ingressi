# Current Feature: Sportelli CRUD — `/admin/sportelli`

## Goal

Replace the placeholder at `app/(admin)/admin/sportelli/page.tsx` with a working
CRUD for the `Counter` model (sportelli): create, edit, activate/deactivate, and
delete counters from the admin dashboard.

## Scope

- `app/(admin)/admin/sportelli/page.tsx` — server component. Loads counters via
  Prisma (ordered active-first, then by name) with `_count.openingWindows`, maps
  to a serializable `CounterListItem[]`, and renders `<CounterManager>`.
- `actions/counters.ts` — Server Actions (`"use server"`): `createCounter`,
  `updateCounter`, `toggleCounterActive`, `deleteCounter`. Each:
  - guards RBAC via `auth()` (only `ADMIN`/`SYSADMIN`);
  - validates with Zod (`name` 2–80, `description` ≤280 optional, `isActive`);
  - returns the `{ success, data, error }` shape (`ActionResult<T>`);
  - calls `revalidatePath("/admin/sportelli")`.
- `components/admin/CounterManager.tsx` — client component. Local-state list
  (seeded from server, updated on each successful action for instant feedback),
  shared create/edit form, status badge, inline delete confirmation, and ephemeral
  toasts for every admin action.
- `types/counter.ts` — `CounterListItem`, `CounterInput`.

## Notes / decisions

- **Delete guard:** `deleteCounter` refuses if the counter has any
  `OpeningWindow` (cascade would wipe windows → slots → bookings). The UI surfaces
  the message and steers the user to *deactivate* instead.
- **No toast lib installed** → a minimal self-contained `ToastViewport` inside
  `CounterManager` (auto-dismiss after 4s), matching the design's "toast per ogni
  azione admin" without adding a dependency.
- Actions live in root-level `actions/` (project has no `src/`), consistent with
  the existing `lib/`, `components/`, `types/` layout.
- Mutations use Server Actions + `useTransition`; reads happen directly in the
  server component (per coding-standards).

## Acceptance

- `npm run lint` and `npm run build` pass; `/admin/sportelli` renders dynamically. ✅
- As `ADMIN`/`SYSADMIN`: can create, edit, toggle, and delete counters; delete is
  blocked for counters with aperture associate.

## Status: COMPLETED (awaiting review)

- Branch: `feature/admin-sportelli` (not yet committed — awaiting permission).
- Next sections: `aperture` (finestre + slot generation), `prenotazioni` table,
  `utenti` management, and the `(cassa)` queue group.
