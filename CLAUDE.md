@AGENTS.md

# Torres Biglietteria

Sistema di gestione prenotazioni per la biglietteria della Torres Sassari. Gli admin aprono gli sportelli, i tifosi prenotano il proprio turno da un calendario pubblico, e i bigliettai gestiscono la coda — con uno schermo pubblico che comunica in tempo reale chi è il prossimo.

**Scope iniziale:** solo le prenotazioni della biglietteria. Progettato per espandersi (accrediti, richieste, ecc.).

## Tech Stack

- **Framework:** Next.js 16 / React 19 (SSR + API routes)
- **Language:** TypeScript (strict)
- **Database:** Neon (serverless PostgreSQL)
- **ORM:** Prisma 7 — usare sempre le migrations, **mai** `prisma db push`
- **Auth:** NextAuth v5 — email/password con ruoli (RBAC)
- **Realtime:** WebSocket / Pusher — coda e schermo pubblico si aggiornano senza refresh
- **Styling:** Tailwind CSS v4 (config CSS-based) + shadcn/ui
- **Email:** Resend — conferme di prenotazione
- **Testing:** Vitest (node env)

## Ruoli (RBAC)

`SYSADMIN` (tutto) → `ADMIN` (apre sportelli, gestisce coda, vede prenotazioni) → `BIGLIETTAIO` (gestisce coda, vede prenotazioni). Ogni ruolo eredita i permessi del ruolo inferiore. Gestione utenti e config globale: solo `SYSADMIN`.

## Domain Model

`Counter` (sportello) → `OpeningWindow` (finestra di apertura) → `BookingSlot` (turno) → `Booking` (prenotazione). Vedi lo schema Prisma completo in [context/project-overview.md](context/project-overview.md).

Stato prenotazione: `PRENOTATA` → `IN_CODA` → `CHIAMATA` → `SERVITA` / `SALTATA`.

## Detailed Guidelines

- **Project spec & data models:** [context/project-overview.md](context/project-overview.md)
- **Coding standards** (TypeScript, React, Next.js, Tailwind v4, Prisma, testing, file organization): [context/coding-standards.md](context/coding-standards.md)
- **AI interaction & workflow** (document → branch → implement → test → commit → merge): [context/ai-interaction.md](context/ai-interaction.md)

## Key Rules

- **Migrations:** sempre `prisma migrate dev` / `prisma migrate deploy`, mai `db push`.
- **Realtime:** ogni cambio di stato della coda emette un evento; schermo pubblico e dashboard bigliettaio si aggiornano in tempo reale.
- **Tailwind v4:** nessun `tailwind.config.{ts,js}`; configurare il tema con `@theme` in `src/app/globals.css`.
- **Colori brand:** usare i token (`bg-brand-primary`, `text-brand-accent`, `bg-brand-surface`) o `COLORS` da `lib/colors.ts`. Mai hardcodare hex. Sorgente: `@theme` in `app/globals.css` + `lib/colors.ts`.
- **Server components by default;** `'use client'` solo quando serve. Server Actions per le mutazioni, API routes per webhook/upload/integrazioni.
- **Validare ogni input con Zod;** Server Actions ritornano `{ success, data, error }`.
- **Workflow:** documentare la feature in `context/current-feature.md`, lavorare su un branch dedicato, `npm run test` + `npm run build` devono passare prima del commit. Non committare senza permesso.
