# Current Feature: Aperture (finestre + slot) — `/admin/aperture`

## Goal

Replace the placeholder at `app/(admin)/admin/aperture/page.tsx` with a working
manager for the `OpeningWindow` model: un admin **apre** uno sportello definendo
una finestra oraria (inizio, fine, durata slot, capacità) — il sistema **genera
gli slot prenotabili** (`BookingSlot`) — e può **chiudere** (eliminare) una
finestra. Coerente con "Apri/chiudi finestre" della spec.

## Scope

- `lib/slots.ts` — logica **pura** di generazione slot da una finestra
  (`generateSlotRanges`): dato `windowStart`/`windowEnd`/`slotDurationMinutes`,
  ritorna gli intervalli `{ startTime, endTime }` allineati alla durata.
  Isolata e testabile (nessuna dipendenza da Prisma/Next).
- `types/opening-window.ts` — `OpeningWindowListItem` (forma serializzabile per
  il client: date come ISO string), `OpeningWindowInput`, `CounterOption`.
- `actions/opening-windows.ts` — Server Actions (`"use server"`):
  - `createOpeningWindow` — guardia RBAC (`ADMIN`/`SYSADMIN`), Zod
    (start < end, durata 1–240 min, capacità 1–100, sportello attivo esistente,
    nessuna sovrapposizione con altre finestre dello stesso sportello),
    genera la finestra **e** i suoi slot in **una transazione**
    (`prisma.$transaction`), ritorna `ActionResult`, `revalidatePath`.
  - `deleteOpeningWindow` — chiude/elimina una finestra; **rifiuta** se ha
    prenotazioni associate (il cascade travolgerebbe slot → prenotazioni).
- `app/(admin)/admin/aperture/page.tsx` — server component. Carica le finestre
  (con nome sportello, `_count.slots`, conteggio prenotazioni) e gli sportelli
  **attivi** per la select del form; mappa a forma serializzabile; rende
  `<OpeningWindowManager>`.
- `components/admin/OpeningWindowManager.tsx` — client component (pattern
  `CounterManager`): stato locale, form di apertura con select sportello +
  `datetime-local` + durata/capacità, riga finestra con conteggio slot/
  prenotazioni, conferma inline di chiusura, toast effimeri.

### Form stack: react-hook-form + zod + shadcn/ui

- **shadcn/ui inizializzato manualmente** (non via CLI, per non riscrivere il
  tema Tailwind v4 brand): `components.json`, `lib/utils.ts` (`cn`), token
  semantici shadcn in `app/globals.css` **mappati sulla brand palette**
  (`--primary`=navy, `--ring`=accento, `--destructive`=status-full, ecc.), e le
  primitive `components/ui/{button,input,label,select,form}.tsx`.
- **`Button`** ha una variante extra `brand` (gradiente accento Torres) per
  mantenere lo stile dei CTA esistenti.
- **Schema condiviso** `lib/schemas/opening-window.ts`
  (`openingWindowFormSchema`): importato sia dal form (`zodResolver`) sia dalla
  Server Action → validazione e messaggi identici sui due lati. Gli orari sono
  stringhe `datetime-local`; la Server Action le converte in `Date`.
- `useWatch` (non `form.watch`) per l'anteprima slot → compatibile col React
  Compiler.
- **Date/ora: picker shadcn, non input nativo.** `components/ui/date-time-picker.tsx`
  (Popover + `Calendar` su react-day-picker v10 + input orario) sostituisce
  `<input type="datetime-local">`, il cui formato a schermo seguiva il locale del
  browser (es. `mm/dd/yyyy`). Il valore resta la stringa "YYYY-MM-DDTHH:mm" (schema
  invariato), ma la visualizzazione è **sempre `dd/mm/yyyy`** via `lib/format.ts`.
  Calendario in locale italiano, settimana da lunedì.
- **Formato date centralizzato** in `lib/format.ts` (`formatDate` → dd/mm/yyyy,
  `formatTime` → HH:mm), usato dal picker e dalla riga finestra.
- Dipendenze aggiunte: `react-hook-form`, `@hookform/resolvers`,
  `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`,
  `@radix-ui/react-{slot,label,select,popover}`, `react-day-picker`, `date-fns`;
  `zod` pinnato come dep diretta.
- **Sportelli (`CounterManager`) non migrato:** resta sul form "plain"; migrabile
  a questo stack in un passo successivo.

## Notes / decisions

- **Solo apri/chiudi, niente modifica:** la spec dice "Apri/chiudi finestre".
  Modificare gli orari dopo la generazione degli slot (eventualmente già
  prenotati) è complesso e fuori scope → solo create + delete.
- **Generazione slot in transazione:** finestra e slot nascono insieme; se la
  generazione fallisce, niente finestra orfana.
- **Guardia sovrapposizione:** due finestre sovrapposte sullo stesso sportello
  genererebbero slot duplicati/ambigui → bloccate in fase di creazione.
- **Delete guard:** `deleteOpeningWindow` rifiuta se esistono prenotazioni sugli
  slot della finestra (coerente col delete guard di `deleteCounter`).
- **Date al confine server→client:** passate come ISO string (i client component
  ricevono solo primitivi, come `CounterListItem`).
- **Niente vitest configurato** nel progetto → la logica di `lib/slots.ts` è
  pura/testabile, ma il gate resta `npm run lint` + `npm run build` + verifica
  browser (parità con la feature sportelli).

## Acceptance

- `npm run lint` e `npm run build` passano; `/admin/aperture` rende dinamicamente.
- Come `ADMIN`/`SYSADMIN`: apertura di una finestra su uno sportello attivo
  genera gli slot attesi (es. 10:00–12:00 @ 10 min → 12 slot); chiusura di una
  finestra senza prenotazioni la rimuove; chiusura bloccata se ci sono
  prenotazioni.

## Status: COMMITTED (awaiting browser verification)

- Branch: `feature/admin-aperture` (committed + pushed, non ancora merged).
- `npm run lint` + `npm run build` passano. Verifica browser (DB + login admin)
  ancora da fare.
- Sezioni successive: `prenotazioni` table, `utenti` management, `(cassa)` queue.
