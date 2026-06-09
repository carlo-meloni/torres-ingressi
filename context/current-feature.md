# Current Feature: Admin Dashboard scaffold — `(admin)` route group

## Goal

Build the authenticated admin/sysadmin dashboard shell described in
`project-overview.md` → Project Structure → `app/(admin)/`: a sidebar layout and
an overview page, with the sub-pages stubbed so navigation works end-to-end.

## Scope

- `app/(admin)/layout.tsx` — server component. Server-side RBAC guard via `auth()`:
  - not authenticated → redirect to sign-in (preserving callback);
  - authenticated but `BIGLIETTAIO` (no admin rights) → redirect to `/cassa/coda`.
  - Renders the sidebar (`components/admin/Sidebar.tsx`), the signed-in user + a
    sign-out server action, and the page content.
- `components/admin/Sidebar.tsx` — client component: nav links with active-route
  highlighting. The **Utenti** entry is shown only to `SYSADMIN`.
- `app/(admin)/page.tsx` — overview with live stat cards (active counters,
  bookings today, in queue, served today) read from Prisma.
- Stub pages so the sidebar never 404s: `sportelli/`, `aperture/`, `prenotazioni/`,
  `utenti/` (utenti is SYSADMIN-only). Each renders an "in costruzione" placeholder
  via a shared `components/admin/PagePlaceholder.tsx`.

## Notes / decisions

- RBAC helper: `ADMIN`/`SYSADMIN` may access `(admin)`; `BIGLIETTAIO` may not.
- `auth()` reads cookies, so the whole `(admin)` segment renders dynamically — the
  Prisma queries in the overview run per request, not at build time.
- Sign-out uses a NextAuth v5 server-action `<form>` (no client SDK / SessionProvider).
- No shadcn/ui is installed yet; UI is plain Tailwind v4 matching the existing
  public pages and the `brand-*` theme tokens.

## Acceptance

- `npm run build` and `npm run lint` pass.
- Visiting `/admin` unauthenticated redirects to sign-in; as `BIGLIETTAIO` redirects
  to `/cassa/coda`; as `ADMIN`/`SYSADMIN` shows the dashboard with a working sidebar.

## Routing note

The structure diagram in `project-overview.md` is schematic: a `page.tsx` at the
route-group root (`app/(admin)/page.tsx`) resolves to `/` and collides with the
public landing. The admin pages therefore live under `app/(admin)/admin/…` so they
resolve to `/admin/*` — matching `proxy.ts` (`matcher: ["/admin/:path*"]`) and the
sidebar links. The `(admin)/layout.tsx` (group root) still wraps them all.

## Status: COMPLETED (scaffold)

- Branch: `feature/admin-dashboard` (not yet committed — awaiting review).
- `npm run build` and `npm run lint` pass; `/admin/*` routes render dynamically.
- Files: `app/(admin)/layout.tsx`, `app/(admin)/admin/page.tsx` + 4 stub pages,
  `components/admin/{Sidebar,PagePlaceholder}.tsx`.
- Next: build out the individual sections (sportelli CRUD, aperture + slot
  generation, prenotazioni table, utenti management) and the `(cassa)` group.
