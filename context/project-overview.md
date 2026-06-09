# Torres Biglietteria — Project Overview

> Un sistema di gestione prenotazioni per la biglietteria della Torres Sassari. Gli admin aprono gli sportelli, i tifosi prenotano il proprio turno da un calendario pubblico, e i bigliettai gestiscono la coda — con uno schermo pubblico che comunica in tempo reale chi è il prossimo.

---

## Table of Contents

- [Problem](#problem)
- [Target Users](#target-users)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Data Models](#data-models)
- [Prisma Schema](#prisma-schema)
- [UI/UX Design System](#uiux-design-system)
- [Project Structure](#project-structure)

---

## Problem

La biglietteria di una squadra di calcio gestisce gli accessi in modo disorganizzato:

| Risorsa                  | Posizione tipica                          |
| ------------------------ | ----------------------------------------- |
| Orari di apertura        | Comunicati sui social, passaparola        |
| File e turni             | Code fisiche disordinate allo sportello   |
| Disponibilità sportelli  | Note interne, decisioni dell'ultimo minuto |
| Chiamata del turno       | Urla del bigliettaio, biglietti cartacei  |
| Affluenza prevista       | Stime a occhio                            |

Questo causa lunghe attese, malcontento dei tifosi, sportelli sovraccarichi e nessuna visibilità sull'affluenza. **Torres Biglietteria** è il sistema unico che organizza aperture, prenotazioni e gestione della coda.

> **Scope:** inizialmente il sistema gestisce **solo le prenotazioni della biglietteria**. È progettato per espandersi in futuro (creazione accrediti. richiese etc).

---

## Target Users

| Utente            | Necessità principale                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| **Sysadmin**      | Gestire l'intero sistema, gli utenti e la configurazione globale                |
| **Admin**         | Aprire e chiudere gli sportelli, definire le fasce orarie, supervisionare       |
| **Bigliettaio**   | Vedere chi è prenotato e a che ora, gestire la coda, chiamare il turno successivo |
| **Tifoso/Cliente** | Prenotare un turno dal calendario pubblico, sapere quando passare              |

---

## Tech Stack

| Layer              | Tecnologia                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) / React 19 — SSR + API routes, single repo      |
| **Language**       | TypeScript                                                                        |
| **Database**       | [Neon](https://neon.tech/) (serverless PostgreSQL)                                |
| **ORM**            | [Prisma 7](https://www.prisma.io/) — always use migrations, never `db push`       |
| **Authentication** | [NextAuth v5](https://authjs.dev/) — email/password con ruoli (RBAC)              |
| **Realtime**       | WebSocket / [Pusher](https://pusher.com/) — aggiornamento coda e schermo pubblico |
| **Styling**        | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Email**          | [Resend](https://resend.com/) — conferme di prenotazione                          |

> **Migration rule:** Non eseguire mai `prisma db push` in nessun ambiente. Generare e applicare sempre le migrations (`prisma migrate dev` / `prisma migrate deploy`).

> **Realtime rule:** Lo schermo pubblico e la dashboard del bigliettaio devono aggiornarsi in tempo reale senza refresh manuale. Ogni cambio di stato della coda emette un evento.

---

## Features

### A. Ruoli e Permessi

Il sistema usa un controllo accessi basato su ruoli (RBAC). Ogni ruolo eredita i permessi del ruolo inferiore.

| Ruolo           | Apri sportelli | Gestisci coda | Vedi prenotazioni | Gestisci utenti | Config globale |
| --------------- | :------------: | :-----------: | :---------------: | :-------------: | :------------: |
| `SYSADMIN`      |       ✅        |      ✅        |        ✅          |       ✅         |      ✅         |
| `ADMIN`         |       ✅        |      ✅        |        ✅          |       ❌         |      ❌         |
| `BIGLIETTAIO`   |       ❌        |      ✅        |        ✅          |       ❌         |      ❌         |

---

### B. Sportelli

Lo **sportello** è il punto fisico dove un bigliettaio serve i clienti. Un admin lo apre per una fascia oraria; gli sportelli aperti determinano quanti turni sono prenotabili.

**Campi per ogni sportello:**

- `name` — nome o numero dello sportello (es. "Sportello 1", "Cassa Tribuna")
- `description` — note opzionali
- `isActive` — sportello attualmente operativo

Un admin **apre uno sportello** definendo una **finestra di apertura** (`OpeningWindow`): una fascia oraria con orario di inizio e fine, e una durata di slot. Da questa finestra il sistema genera gli **slot prenotabili**.

---

### C. Finestre di Apertura e Slot

| Concetto         | Significato                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| `OpeningWindow`  | Una fascia oraria in cui uno sportello è aperto (es. lun 10:00–13:00)       |
| `slotDuration`   | Durata di ogni slot prenotabile in minuti (es. 10 min)                      |
| `BookingSlot`    | Singolo turno prenotabile, generato dalla finestra (es. 10:00, 10:10, …)    |
| `capacity`       | Numero di prenotazioni possibili per slot (di norma 1, configurabile)       |

In base alle finestre di apertura attive in un determinato range di tempo, il calendario pubblico mostra gli slot disponibili con un colore che indica lo stato di apertura.

---

### D. Calendario Pubblico e Prenotazioni

I tifosi accedono alla parte pubblica del sito e prenotano un turno dal calendario. Non è richiesta autenticazione (o solo email per la conferma).

**Stato degli slot nel calendario (colori):**

| Stato         | Colore | Hex       | Significato                          |
| ------------- | ------ | --------- | ------------------------------------ |
| `aperto`      | Verde  | `#10b981` | Sportello aperto, slot prenotabile   |
| `quasi_pieno` | Ambra  | `#f59e0b` | Pochi posti rimasti                  |
| `pieno`       | Rosso  | `#ef4444` | Slot al completo, non prenotabile    |
| `chiuso`      | Grigio | `#6b7280` | Biglietteria chiusa in quella fascia |

**Campi per ogni prenotazione:**

- `name` — nome del cliente
- `email` — email per la conferma (opzionale)
- `phone` — telefono (opzionale)
- `slotId` — slot prenotato
- `ticketNumber` — numero progressivo del turno (assegnato alla prenotazione)
- `status` — `PRENOTATA` / `IN_CODA` / `CHIAMATA` / `SERVITA` / `SALTATA`
- `createdAt` — momento della prenotazione

Alla conferma, il cliente riceve il numero del proprio turno (e una email via Resend se fornita).

---

### E. Gestione Coda (Bigliettaio)

Il bigliettaio gestisce in tempo reale i clienti in attesa.

- 👁️ Vede l'elenco delle prenotazioni per il proprio sportello, ordinate per orario
- ▶️ **Chiama il turno successivo** — segna la prenotazione come `CHIAMATA` e aggiorna lo schermo pubblico
- ✅ Segna un cliente come `SERVITA`
- ⏭️ Segna come `SALTATA` chi non si presenta
- 🔄 La coda si aggiorna in realtime su tutte le postazioni

---

### F. Schermo Pubblico (Display Coda)

Una schermata pensata per essere mostrata su un monitor/TV in biglietteria, visibile ai clienti in fila. **Testi grandi e ad alto contrasto**, leggibili da lontano.

- Mostra il **numero del turno attualmente chiamato** (carattere molto grande)
- Mostra lo **sportello** a cui presentarsi
- Mostra i **prossimi turni in attesa**
- Si aggiorna automaticamente in realtime a ogni "chiama il prossimo"
- Nessuna interazione: è una vista in sola lettura, a tutto schermo

> **Design:** questa schermata usa una scala tipografica dedicata, molto più grande del resto dell'app, perché deve essere leggibile da diversi metri di distanza in un ambiente affollato.

---

### G. Dashboard Admin / Sysadmin

Accessibile solo agli utenti autenticati con ruolo adeguato, via `/admin`.

- 🪟 Apertura e chiusura sportelli con definizione delle finestre orarie
- 🗓️ Calendario di gestione: vista di tutti gli slot generati
- 📋 Elenco completo delle prenotazioni per data/sportello
- 📊 Statistiche base (prenotazioni per giorno, affluenza, no-show)
- 👥 Gestione utenti e ruoli — **solo sysadmin**
- ⚙️ Configurazione globale (durata slot di default, capacità) — **solo sysadmin**

---

## Data Models

### Relationships Overview

```
User (sysadmin / admin / bigliettaio)
 ├── OpeningWindows aperte (1:many, come admin)
 └── Bookings gestite (1:many, come bigliettaio)

Counter (sportello)
 └── OpeningWindows (1:many)

OpeningWindow
 ├── Counter (many:1)
 └── BookingSlots (1:many)

BookingSlot
 ├── OpeningWindow (many:1)
 └── Bookings (1:many)

Booking
 └── BookingSlot (many:1)
```

---

## Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth & Roles ──────────────────────────────────────────────────────────

enum Role {
  SYSADMIN
  ADMIN
  BIGLIETTAIO
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?
  role          Role      @default(BIGLIETTAIO)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  openedWindows   OpeningWindow[] @relation("OpenedBy")
  servedBookings  Booking[]       @relation("ServedBy")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Counters (Sportelli) ─────────────────────────────────────────────────

model Counter {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  openingWindows OpeningWindow[]
}

// ─── Opening Windows (Finestre di apertura) ─────────────────────────────────

model OpeningWindow {
  id           String   @id @default(cuid())
  startTime    DateTime
  endTime      DateTime
  slotDuration Int      @default(10) // minuti
  capacity     Int      @default(1)  // prenotazioni per slot
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  counterId String
  counter   Counter @relation(fields: [counterId], references: [id], onDelete: Cascade)

  openedById String?
  openedBy   User?   @relation("OpenedBy", fields: [openedById], references: [id])

  slots BookingSlot[]
}

// ─── Booking Slots (Turni) ──────────────────────────────────────────────────

model BookingSlot {
  id        String   @id @default(cuid())
  startTime DateTime
  endTime   DateTime
  capacity  Int      @default(1)
  createdAt DateTime @default(now())

  openingWindowId String
  openingWindow   OpeningWindow @relation(fields: [openingWindowId], references: [id], onDelete: Cascade)

  bookings Booking[]

  @@index([startTime])
}

// ─── Bookings (Prenotazioni) ─────────────────────────────────────────────────

enum BookingStatus {
  PRENOTATA
  IN_CODA
  CHIAMATA
  SERVITA
  SALTATA
}

model Booking {
  id           String        @id @default(cuid())
  name         String
  email        String?
  phone        String?
  ticketNumber Int
  status       BookingStatus @default(PRENOTATA)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  slotId String
  slot   BookingSlot @relation(fields: [slotId], references: [id], onDelete: Cascade)

  servedById String?
  servedBy   User?   @relation("ServedBy", fields: [servedById], references: [id])

  @@index([status])
}
```

---

## UI/UX Design System

### Layout Dashboard Admin

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (collassabile)   │  Main Content             │
│                           │                           │
│  • Sportelli              │  [Calendario aperture]    │
│  • Aperture               │                           │
│  • Prenotazioni           │  [Apri sportello →]       │
│  • Coda                   │                           │
│  • Statistiche            │  [Elenco slot generati]   │
│  ─────────────────        │                           │
│  • Utenti (sysadmin)      │                           │
│  [Avatar utente]          │                           │
└──────────────────────────────────────────────────────┘
```

### Layout Dashboard Bigliettaio

```
┌──────────────────────────────────────────────────────┐
│  Sportello: Cassa Tribuna          [▶ Chiama prossimo]│
├──────────────────────────────────────────────────────┤
│  In servizio ora:  TURNO 042                          │
├──────────────────────────────────────────────────────┤
│  In coda                                              │
│  043 — Mario Rossi      10:10   [Servita] [Saltata]   │
│  044 — Anna Bianchi     10:20   [Servita] [Saltata]   │
│  045 — Luca Verdi       10:30   [Servita] [Saltata]   │
└──────────────────────────────────────────────────────┘
```

### Schermo Pubblico (Display Coda)

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│                  TURNO                                 │
│                                                        │
│                  ┌─────────┐                           │
│                  │   042   │   ← carattere enorme      │
│                  └─────────┘                           │
│                                                        │
│              SPORTELLO  3                              │
│                                                        │
├──────────────────────────────────────────────────────┤
│   Prossimi:   043    044    045                        │
└──────────────────────────────────────────────────────┘
```

### Calendario Pubblico

```
┌──────────────────────────────────────────────────────┐
│  Header (Prenota / Info / Torres Sassari)             │
├──────────────────────────────────────────────────────┤
│   Lun   Mar   Mer   Gio   Ven   Sab   Dom             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │🟢 │ │⬜ │ │🟢 │ │🟠 │ │🔴 │ │🟢 │ │⬜ │           │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘           │
│                                                        │
│  Slot del 10/06:  10:00🟢  10:10🟢  10:20🟠  10:30🔴 │
└──────────────────────────────────────────────────────┘
```

### Principi di Design

- Identità visiva legata alla Torres Sassari (colori sociali: rosso e blu)
- Chiarezza e velocità: il flusso di prenotazione deve essere immediato anche da mobile
- Codice colore coerente per lo stato degli slot (verde/ambra/rosso/grigio)
- **Schermo pubblico** con scala tipografica dedicata: numeri giganti, alto contrasto, leggibili da lontano
- Light mode di default; dark mode per lo schermo pubblico (riduce l'affaticamento su monitor sempre accesi)
- Mobile-first per il calendario pubblico; desktop per le dashboard

### Micro-interactions

- Aggiornamento realtime della coda senza refresh (animazione sul cambio turno)
- Conferma di prenotazione con toast e numero del turno bene in vista
- Skeleton loader sul calendario durante il caricamento degli slot
- Transizione animata del numero chiamato sullo schermo pubblico
- Toast per tutte le azioni admin (apri sportello, chiudi, elimina…)

---

## Project Structure

```
torres-biglietteria/
├── app/
│   ├── (public)/                   # Parte pubblica (no auth)
│   │   ├── page.tsx                # Landing / info biglietteria
│   │   ├── prenota/
│   │   │   ├── page.tsx            # Calendario prenotazioni
│   │   │   └── conferma/
│   │   │       └── page.tsx        # Conferma + numero turno
│   │   └── display/
│   │       └── page.tsx            # Schermo pubblico coda (fullscreen)
│   ├── (admin)/                    # Dashboard admin/sysadmin (auth)
│   │   ├── layout.tsx              # Sidebar layout
│   │   ├── page.tsx                # Overview
│   │   ├── sportelli/
│   │   │   └── page.tsx
│   │   ├── aperture/
│   │   │   └── page.tsx            # Apri/chiudi finestre
│   │   ├── prenotazioni/
│   │   │   └── page.tsx
│   │   └── utenti/
│   │       └── page.tsx            # Solo sysadmin
│   ├── (cassa)/                    # Dashboard bigliettaio (auth)
│   │   ├── layout.tsx
│   │   └── coda/
│   │       └── page.tsx            # Gestione coda realtime
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   └── api/
│       ├── auth/                   # NextAuth handlers
│       ├── sportelli/              # CRUD sportelli
│       ├── aperture/               # CRUD finestre + generazione slot
│       ├── prenotazioni/           # Creazione + cambio stato
│       └── coda/                   # Chiama prossimo + eventi realtime
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── admin/
│   │   ├── CounterForm.tsx
│   │   ├── OpeningWindowForm.tsx
│   │   ├── BookingsTable.tsx
│   │   └── Sidebar.tsx
│   ├── cassa/
│   │   ├── QueuePanel.tsx
│   │   └── CallNextButton.tsx
│   ├── display/
│   │   └── QueueDisplay.tsx        # Schermo pubblico
│   └── public/
│       ├── BookingCalendar.tsx
│       ├── SlotPicker.tsx
│       └── BookingForm.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth config + RBAC
│   ├── realtime.ts                 # WebSocket / Pusher client
│   ├── slots.ts                    # Generazione slot da finestre
│   └── resend.ts                   # Email client
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── types/
    └── index.ts
```

---

_Last updated: June 2026_