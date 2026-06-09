# Current Feature: Prisma 7 + Neon PostgreSQL Setup

## Goal

Set up Prisma ORM (v7) with a Neon serverless PostgreSQL database, including the
initial schema based on the data models in `project-overview.md` and the NextAuth
models. We always work via migrations — never `prisma db push`.

## Scope

- Install Prisma 7 + the Neon driver adapter (Prisma 7 requires a driver adapter).
- Configure the new Prisma 7 setup:
  - `prisma-client` generator with a required `output` path.
  - `prisma.config.ts` (the Prisma 7 replacement for env auto-loading / CLI config).
  - Driver adapter (`@prisma/adapter-neon` + `@neondatabase/serverless`).
- Initial schema: `User`, `Account`, `Session`, `VerificationToken`, `Counter`,
  `OpeningWindow`, `BookingSlot`, `Booking`, plus the `Role` and `BookingStatus`
  enums — with indexes and cascade deletes per `project-overview.md`.
- Prisma client singleton at `lib/prisma.ts`.
- `.env.example` documenting `DATABASE_URL` (Neon dev branch).
- `package.json` scripts for migrate/generate; `postinstall` to generate the client.

## Prisma 7 breaking changes accounted for

- Generator is `prisma-client` (not `prisma-client-js`); `output` is required and the
  client is generated **outside** `node_modules` (into `generated/prisma`).
- All databases require a **driver adapter** — using `@prisma/adapter-neon`.
- `prisma.config.ts` is the new config home; env vars are loaded explicitly
  (`dotenv`) rather than automatically.
- Client is imported from the generated path, not `@prisma/client`.

## Environment / DB

- `DATABASE_URL` points to the **Neon development branch** while developing.
- Production uses a separate Neon branch via `prisma migrate deploy`.
- Migrations are always generated (`prisma migrate dev`) — never `db push`.
- NOTE: creating the initial migration requires a live Neon `DATABASE_URL`; the rest
  of the setup (schema, config, client, `prisma generate`) works without a DB.

## Acceptance

- `npm run build` passes (Prisma client generated).
- `prisma/schema.prisma`, `prisma.config.ts`, `lib/prisma.ts`, `.env.example` in place.
- Initial migration created once a Neon `DATABASE_URL` is available.

## Status: COMPLETED

- Initial migration `prisma/migrations/20260609091613_init` created against the Neon
  dev branch and applied — `prisma migrate status` reports the schema is up to date.
- Idempotent seed at `prisma/seed.ts`, run on demand via `npm run db:seed` (not wired
  into prisma.config.ts, so it never auto-runs on migrate). Seeds a SYSADMIN + Counters;
  passwords hashed with bcryptjs.
- `npm run build` passes; `prisma generate` / `prisma validate` clean.
- Committed and merged to `main`.

## History

- 2026-06-09 — Prisma 7 + Neon setup + on-demand seed. Merged via
  `feature/prisma-neon-setup`.
