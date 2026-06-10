# Current Feature: Contenuti hero modificabili dal SYSADMIN — `/admin/contenuti`

## Goal

Permettere al `SYSADMIN` di modificare i testi dell'hero della landing pubblica
(`app/(public)/page.tsx`) senza toccare il codice. Su scelta dell'utente, sono
editabili **solo titolo e sottotitolo** (la CTA "Prenota ora" resta fissa).

## Scope

- `prisma/schema.prisma` — nuovo model **singleton** `SiteSetting` (`id` fisso
  `"default"`, `heroTitle`, `heroSubtitle`, `updatedAt`). Migration
  `add_site_settings` (creata e applicata; client rigenerato).
- `lib/site-content.ts` — `SITE_SETTING_ID`, tipo `HeroContent`, `DEFAULT_HERO`
  (i testi attuali come fallback) e `getHeroContent()` (legge la riga singleton
  con fallback ai default se non ancora salvata).
- `lib/schemas/site-content.ts` — `heroContentSchema` Zod condiviso (form +
  action): `title`/`subtitle` trimmed, lunghezze min/max.
- `actions/site-content.ts` — `updateHeroContent`: guardia `requireSysadmin`,
  Zod, `upsert` sulla riga singleton, `revalidatePath('/','/admin/contenuti')`.
- `components/admin/HeroContentForm.tsx` — client form (pattern manager): textarea
  multilinea per titolo/sottotitolo, stato `dirty`, annulla, toast.
- `app/(admin)/admin/contenuti/page.tsx` — server component, guardia di ruolo
  (redirect non-sysadmin → `/admin`), carica `getHeroContent()` → `<HeroContentForm>`.
- `components/admin/Sidebar.tsx` — voce "Contenuti" (solo `SYSADMIN`).
- `app/(public)/page.tsx` — ora `async` + `force-dynamic`; i 4 `<h1>` hardcoded
  diventano un unico titolo `whitespace-pre-line` (gli a capo del testo salvato
  fanno le righe) + sottotitolo, entrambi da `getHeroContent()`.

## Notes / decisions

- **Solo titolo + sottotitolo (deciso con l'utente):** opzione più semplice; le
  righe accent (luogo/orario) e la CTA non sono più configurabili. Il titolo
  multilinea preserva gli a capo via `whitespace-pre-line`.
- **Singleton con id fisso:** una sola riga di config (`"default"`); nessun seed
  richiesto — `getHeroContent` fa fallback ai `DEFAULT_HERO` finché non si salva.
- **`force-dynamic` sulla landing:** prima statica; ora legge il DB a ogni
  richiesta così che ogni salvataggio sysadmin sia subito visibile (la
  `revalidatePath('/')` copre comunque la cache).
- **Niente vitest configurato** (nessuno script `test`) → gate = `npm run lint` +
  `npm run build`.

## Acceptance

- `npm run lint` (solo warning pre-esistente su `STEPS`) e `npm run build`
  passano; `/` è dinamica (`ƒ`), `/admin/contenuti` registrata. ✅
- `/admin/contenuti` rende solo per sysadmin (ADMIN/BIGLIETTAIO → redirect
  `/admin`); salvando, l'hero pubblico mostra i nuovi testi.

## Status: IMPLEMENTED (awaiting browser verification + commit permission)

- Lavorato su `main` (working tree). `npm run lint` + `npm run build` passano.

---

# Feature precedente: Dashboard bigliettaio `(cassa)` + coda realtime (Pusher)

## Goal

Creare la dashboard del bigliettaio (`/coda`, route group `(cassa)`) per gestire la
coda reale del giorno — chiamare il prossimo turno, segnarlo servito o saltato — e
collegare lo schermo pubblico `/display` ai dati reali (sostituendo il mock). Gli
aggiornamenti sono realtime via Pusher: ogni cambio di stato emette un evento e sia la
dashboard sia lo schermo si aggiornano senza refresh.

## Scope

- `lib/realtime.ts` — Pusher lato server: `QUEUE_CHANNEL`/`QUEUE_UPDATED`,
  `emitQueueUpdate(snapshot)` (best-effort; no-op senza chiavi).
- `lib/use-queue-channel.ts` — hook client (`pusher-js`): sottoscrive il canale e
  ritorna lo snapshot live; `onPing` per la cassa (→ `router.refresh()`). No-op senza
  env pubbliche.
- `lib/queue.ts` — `getQueue()`: un'unica lettura del giorno → `{ cassa, snapshot }`
  (sportelli aperti oggi, turno `CHIAMATA` e attesa per sportello, `servedToday`).
- `actions/queue.ts` — `callNext(counterId)` (chiude la `CHIAMATA` corrente → `SERVITA`,
  chiama il prossimo in attesa, in transazione), `markServed`/`markSkipped` (solo da
  `CHIAMATA`). Guardia `requireQueueAccess` (qualsiasi autenticato). Ogni mutazione →
  `emitQueueUpdate` + `revalidatePath('/coda','/display')`.
- `app/(cassa)/layout.tsx` — guardia auth (qualsiasi ruolo), header brand + logout.
- `app/(cassa)/coda/page.tsx` — server component `force-dynamic` → `<QueuePanel>`.
- `components/cassa/QueuePanel.tsx` + `CallNextButton.tsx` — card per sportello (turno
  in chiamata, Servita/Salta, prossimi), realtime come "ping".
- `types/booking.ts` — `QueueSnapshot` rifinito (`latestCounterId` nullable, niente
  `nextFree`) + tipi cassa (`QueueBooking`/`CounterQueue`/`CassaQueueData`).
- `app/(public)/display/page.tsx` + `components/display/QueueDisplay.tsx` — dati reali +
  hook realtime; rimossa la simulazione. `formatTicket` spostato in `lib/format.ts`;
  **eliminato** `lib/mock-queue.ts`.
- `components/admin/Sidebar.tsx` — voce "Coda" → `/coda`. `.env.example` — chiavi Pusher.

## Notes / decisions

- **URL `/coda`:** `(cassa)` è un route group (niente segmento URL), come da spec
  in `context/project-overview.md`.
- **RBAC coda:** `BIGLIETTAIO`/`ADMIN`/`SYSADMIN` (qualsiasi autenticato), coerente con i
  ruoli che "gestiscono la coda".
- **Pusher opzionale:** senza chiavi il realtime è disattivato ma l'app funziona via
  `revalidatePath` (il client che agisce vede comunque l'aggiornamento). `pusher-js`
  resta confinato al bundle client.
- **Cassa = "ping":** sull'evento la dashboard fa `router.refresh()` (ricarica i dati
  server) invece di sincronizzare una seconda forma dati.
- **Niente vitest configurato** → gate = `npm run lint` + `npm run build`.

## Acceptance

- `npm run lint` e `npm run build` passano; `/coda` rende dinamicamente per utenti
  autenticati (non autenticato → sign-in con callback).
- "Chiama prossimo" porta il turno a `CHIAMATA` e aggiorna `/display` in realtime;
  Servita/Salta concludono il turno; `servedToday` incrementa su Servita.

## Status: IMPLEMENTED (awaiting browser verification + commit permission)

- Branch: `feature/cassa-coda` (non ancora committato).
- Verifica realtime end-to-end richiede chiavi Pusher nel `.env`.

---

# Feature precedente: Gestione utenti — `/admin/utenti` (solo SYSADMIN)

## Goal

Sostituire il placeholder a `app/(admin)/admin/utenti/page.tsx` con la gestione
completa degli account: CRUD di `User` con ruoli (`SYSADMIN`/`ADMIN`/
`BIGLIETTAIO`), **riservata al sysadmin**. Coerente con la spec ("Gestione utenti
e config globale: solo SYSADMIN") e con lo stesso pattern manager dei sportelli.

## Scope

- `types/user.ts` — `UserListItem` (forma serializzabile: `createdAt` ISO string,
  `role` dall'enum Prisma) e `UserInput` (payload create/update; `password`
  opzionale, vuota = invariata in modifica).
- `lib/user-role.ts` — `ROLE_META` (etichetta + descrizione + classi badge
  **letterali** sui token brand) e `ROLE_ORDER` (sysadmin→bigliettaio) per select
  ed elenchi.
- `actions/users.ts` — `createUser`/`updateUser`/`deleteUser`. Guardia
  `requireSysadmin`. Zod: create con password obbligatoria (min 8), update con
  password opzionale; email lowercased + unicità verificata; password cifrata con
  bcrypt. Auto-protezione: un sysadmin non può eliminare sé stesso né togliersi
  il ruolo sysadmin (no lockout). `revalidatePath('/admin/utenti')`.
- `app/(admin)/admin/utenti/page.tsx` — server component. Guardia di ruolo
  (ridondante col layout ma protegge la query), carica gli utenti per
  `createdAt desc`, mappa a `UserListItem`, passa `currentUserId` e rende
  `<UserManager>`.
- `components/admin/UserManager.tsx` — client manager (pattern `CounterManager`):
  lista con badge ruolo + indicatore "Tu", form create/edit con select ruolo
  (disabilitato per sé stessi), password mostrata come "lascia vuota per non
  cambiarla" in modifica, elimina con conferma (nascosta per sé stessi), toast.

## Notes / decisions

- **Solo SYSADMIN:** la spec assegna gestione utenti e config globale al solo
  sysadmin; ADMIN/BIGLIETTAIO non vedono nemmeno la voce in sidebar (già gestito).
- **Auto-protezione lato server:** le regole "no self-delete" e "no self-demote"
  sono applicate nelle Server Action (sorgente di verità), non solo nascoste in UI.
- **Password con bcrypt (cost 10):** coerente con `auth.ts` e `/api/auth/register`.
- **Niente vitest configurato** → gate = `npm run lint` + `npm run build`.

## Acceptance

- `npm run lint` e `npm run build` passano; `/admin/utenti` rende dinamicamente
  solo per sysadmin (ADMIN/BIGLIETTAIO → redirect `/admin`).
- Creazione/modifica/eliminazione utenti funzionano; password nuova consente il
  login; email duplicata e auto-azioni proibite mostrano errore.

## Status: IMPLEMENTED (awaiting browser verification + commit permission)

- Branch: `feature/admin-utenti` (non ancora committato).

---

# Feature precedente: Prenotazioni (elenco admin) — `/admin/prenotazioni`

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
