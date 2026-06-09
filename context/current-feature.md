# Current Feature: Prenotazioni (elenco admin) — `/admin/prenotazioni`

## Goal

Replace the placeholder at `app/(admin)/admin/prenotazioni/page.tsx` with l'elenco
completo delle prenotazioni dei tifosi, in **sola lettura**, con filtri per data,
sportello e stato. Coerente con la spec ("Elenco completo delle prenotazioni per
data/sportello" della Dashboard Admin) e con la separazione dei ruoli: ADMIN
**vede** le prenotazioni; la gestione di coda e i cambi di stato restano nella
vista bigliettaio `(cassa)`.

## Scope

- `types/booking.ts` — aggiunti `BookingStatusValue` (unione di letterali
  allineata all'enum Prisma `BookingStatus`, per non importare l'enum generato
  oltre il confine server→client), `BookingListItem` (forma serializzabile: date
  come ISO string, sportello denormalizzato) e `BookingCounterOption` (filtro).
- `lib/booking-status.ts` — `BOOKING_STATUS_META` (etichetta + classi badge
  mappate sui token brand/status, **letterali** per Tailwind v4) e
  `BOOKING_STATUS_ORDER` (ordine del filtro = ciclo di vita).
- `app/(admin)/admin/prenotazioni/page.tsx` — server component. Carica le
  prenotazioni con orario slot e sportello (`slot.openingWindow.counter`),
  ordinate per orario slot poi `ticketNumber`; mappa a `BookingListItem`; deriva
  gli sportelli presenti (dedup) per il filtro; rende `<BookingsTable>`.
- `components/admin/BookingsTable.tsx` — client component. Tabella ordinata per
  orario con badge di stato; **filtro lato client** (`useMemo`) per data /
  sportello / stato via `Select` shadcn; stati vuoti distinti per "nessuna
  prenotazione" e "nessun risultato dai filtri".

## Notes / decisions

- **Sola lettura (deciso con l'utente):** la spec elenca ADMIN come "Vede
  prenotazioni"; i cambi di stato (`IN_CODA`/`CHIAMATA`/`SERVITA`/`SALTATA`) e la
  chiamata del turno appartengono alla vista `(cassa)`. Niente Server Action qui.
- **Filtro lato client:** il dataset admin è ragionevole e il filtro è puramente
  presentazionale → nessun round-trip al server, coerente con lo stato locale
  degli altri manager. Se il volume crescerà, si potrà passare a query filtrate.
- **Date al confine server→client:** ISO string, come `OpeningWindowListItem`.
- **`BookingStatus` generato è `as const`** → il suo tipo è esattamente l'unione
  di letterali, quindi `b.status` è assegnabile a `BookingStatusValue` senza cast.
- **Filtro data per giorno** via `formatDate` (dd/mm/yyyy), usato come chiave ed
  etichetta per coerenza con il locale dell'app.
- **Niente vitest configurato** → gate = `npm run lint` + `npm run build` +
  verifica browser (parità con sportelli/aperture).

## Acceptance

- `npm run lint` e `npm run build` passano; `/admin/prenotazioni` rende
  dinamicamente. ✅
- Senza prenotazioni: stato vuoto. Con prenotazioni: tabella ordinata per orario,
  badge di stato, filtri per data/sportello/stato che restringono le righe;
  filtro senza risultati → stato vuoto dedicato.

## Status: IMPLEMENTED (awaiting browser verification + commit permission)

- Branch: `feature/admin-prenotazioni` (non ancora committato).
- `npm run lint` + `npm run build` passano. Verifica browser (DB + login admin,
  servono prenotazioni reali) ancora da fare. Commit in attesa di permesso.

---

# Feature collegata: Prenotazione reale dal calendario pubblico — `/prenota`

## Goal

Rendere reale il flusso pubblico: leggere gli slot dalle finestre di apertura,
**persistere** la prenotazione e assegnare un numero di turno reale. Prima
`/prenota` usava dati mockati (`lib/mock-data.ts`) e generava un turno fittizio;
ora alimenta `/admin/prenotazioni` con dati veri.

## Scope

- `lib/booking-calendar.ts` — `getBookingCalendar()`: legge gli slot **futuri**
  degli sportelli **attivi**, calcola `seatsLeft = capacità − prenotazioni`,
  deriva lo stato (`statusFromSeats`) e raggruppa per giornata in `CalendarDay[]`
  (gli `id` degli slot sono i veri cuid di `BookingSlot`). Sostituisce
  `lib/mock-data.ts` (rimosso).
- `lib/schemas/booking.ts` — `bookingFormSchema` condiviso (form + action):
  `slotId`, `name` (≥2), `email`/`phone` opzionali (vuoto → undefined).
- `actions/bookings.ts` — `createBooking`: Zod, in **transazione** verifica che
  lo slot esista, sia futuro e non al completo, assegna il `ticketNumber`
  **progressivo per giornata** e crea la `Booking` (`PRENOTATA`);
  `revalidatePath('/prenota')` + `'/admin/prenotazioni'`. Nessun auth (parte
  pubblica). Email Resend **rimandata** a uno step successivo.
- `app/(public)/prenota/page.tsx` — server component `async` + `force-dynamic`
  (la disponibilità cambia a ogni prenotazione); stato vuoto se non ci sono
  giornate prenotabili.
- `components/public/BookingForm.tsx` — validazione client + chiamata a
  `createBooking`; al successo redirect a `/conferma` col turno reale, altrimenti
  errore inline (es. slot pieno).

## Notes / decisions

- **Numerazione per giornata (deciso con l'utente):** il turno riparte ogni
  giorno (max del giorno + 1). La numerazione legge-poi-scrive in transazione:
  sotto forte concorrenza due richieste potrebbero collidere — accettabile per la
  scala; all'occorrenza alzare l'isolamento o usare una sequenza dedicata.
- **Giornate/fasce in fuso server:** chiavi giorno e label orario sono calcolate
  con i metodi locali (`getHours`, ecc.), coerenti con come gli slot vengono
  generati e mostrati.
- **Fasce orarie, non sportelli:** se più sportelli sono aperti alla stessa ora,
  i loro `BookingSlot` sono uniti in un'unica fascia con i posti **sommati**; il
  tifoso prenota una fascia (`CalendarSlot.id` = istante ISO, non un singolo
  sportello). Perciò `CalendarSlot` non espone più `counterName`.
- **Bilanciamento sportelli a booking-time:** `createBooking` riceve l'istante
  della fascia e, **dentro la transazione**, sceglie tra gli sportelli aperti a
  quell'ora quello **meno carico** (`bookings` minori, tie-break per id). Così le
  prenotazioni si distribuiscono tra gli sportelli sullo stato corrente del DB,
  anche con richieste ravvicinate — non si concentrano su uno scelto al render.
- **Stato giornata a 3 valori:** a livello di giornata il dot è solo Disponibile
  / Completo / Chiuso; "Quasi pieno" resta solo sulla singola fascia (legenda
  slot invariata).

## Acceptance

- `npm run lint` + `npm run build` passano; `/prenota` è dinamica (`ƒ`).
- Con finestre aperte: il calendario mostra gli slot reali; prenotando si crea
  una `Booking` e la conferma mostra il turno assegnato; lo slot riflette i posti
  residui; la prenotazione compare in `/admin/prenotazioni`.

## Status: IMPLEMENTED (awaiting browser verification + commit permission)

- Stessa branch `feature/admin-prenotazioni` (le due feature sono complementari:
  il flusso pubblico produce i dati che la tabella admin mostra).
- Sezioni successive: email Resend di conferma, `utenti` management,
  `(cassa)` queue + display realtime.
