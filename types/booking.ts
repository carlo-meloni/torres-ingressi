/**
 * Tipi del flusso di prenotazione pubblico.
 *
 * Il calendario è costruito dai dati reali (`lib/booking-calendar.ts`) a partire
 * da `BookingSlot`/`Booking`: queste interfacce ne sono la forma serializzabile
 * passata ai client component.
 */

/** Stato di apertura di uno slot nel calendario pubblico. */
export type SlotStatus = "aperto" | "quasi_pieno" | "pieno" | "chiuso";

/**
 * Singolo turno prenotabile mostrato nel calendario.
 *
 * Rappresenta una **fascia oraria**, non un singolo sportello: se più sportelli
 * sono aperti alla stessa ora, i loro slot sono uniti in un'unica fascia e i
 * posti sono sommati. Lo sportello effettivo viene assegnato in fase di
 * prenotazione (lo si vede nella conferma).
 */
export interface CalendarSlot {
  /** Identificatore della fascia: istante di inizio in ISO (non un singolo sportello). */
  id: string;
  /** Orario di inizio in formato "HH:mm" (es. "10:00"). */
  time: string;
  status: SlotStatus;
  /** Posti ancora prenotabili in questa fascia (somma su tutti gli sportelli). */
  seatsLeft: number;
}

/** Una giornata del calendario con i relativi slot. */
export interface CalendarDay {
  /** Data in formato ISO "YYYY-MM-DD". */
  date: string;
  /** Etichetta breve del giorno (es. "Lun"). */
  weekday: string;
  /** Numero del giorno del mese (es. "10"). */
  dayNumber: string;
  /** Etichetta del mese (es. "giu"). */
  month: string;
  /** Stato aggregato della giornata, per colorare il selettore. */
  status: SlotStatus;
  slots: CalendarSlot[];
}

/** Dati raccolti dal form di prenotazione. */
export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
}

/* ── Gestione prenotazioni (admin) ────────────────────────────────────── */

/**
 * Stato di una prenotazione. Unione di letterali allineata all'enum Prisma
 * `BookingStatus`: i client component ricevono solo primitivi, quindi non
 * importiamo l'enum generato di Prisma oltre il confine server→client.
 */
export type BookingStatusValue =
  | "PRENOTATA"
  | "IN_CODA"
  | "CHIAMATA"
  | "SERVITA"
  | "SALTATA";

/**
 * Prenotazione nella tabella admin (sola lettura).
 *
 * Le date attraversano il confine server→client come ISO string, come per
 * `OpeningWindowListItem`.
 */
export interface BookingListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** Numero progressivo del turno. */
  ticketNumber: number;
  status: BookingStatusValue;
  /** Momento della prenotazione (ISO string). */
  createdAt: string;
  /** Inizio dello slot prenotato (ISO string). */
  slotStart: string;
  /** Fine dello slot prenotato (ISO string). */
  slotEnd: string;
  /** Sportello che ha servito/chiamato il turno; `null` finché non è chiamato. */
  counterId: string | null;
  /** Nome dello sportello che ha servito/chiamato; `null` finché non è chiamato. */
  counterName: string | null;
}

/** Sportello selezionabile nel filtro della tabella prenotazioni. */
export interface BookingCounterOption {
  id: string;
  name: string;
}

/* ── Coda / schermo pubblico ──────────────────────────────────────────── */

/** Uno sportello attivo mostrato sullo schermo pubblico della coda. */
export interface DisplayCounter {
  id: string;
  /** Nome visibile (es. "Sportello 3"). */
  name: string;
}

/**
 * Istantanea della coda mostrata sullo schermo pubblico.
 *
 * Costruita dai dati reali del giorno (`lib/queue.ts`) e aggiornata in tempo
 * reale via Pusher: lo schermo pubblico riceve questa istantanea come payload
 * dell'evento `queue-updated` (vedi `lib/realtime.ts`).
 */
export interface QueueSnapshot {
  /** Sportelli aperti, in ordine di visualizzazione. */
  counters: DisplayCounter[];
  /** Numero servito ora a ciascuno sportello (per id); `null` se libero. */
  serving: Record<string, number | null>;
  /** Sportello dell'ultima chiamata (è l'hero dello schermo); `null` se nessuna. */
  latestCounterId: string | null;
  /** Prossimi numeri in coda, in ordine di chiamata. */
  upcoming: number[];
}

/* ── Coda / dashboard bigliettaio (cassa) ─────────────────────────────── */

/** Una prenotazione in coda, nella forma serializzabile usata dalla cassa. */
export interface QueueBooking {
  id: string;
  ticketNumber: number;
  name: string;
  status: BookingStatusValue;
}

/**
 * Sportello nella dashboard del bigliettaio. La coda d'attesa è **condivisa**
 * (vedi `CassaQueueData.waiting`): lo sportello mostra solo il turno che sta
 * chiamando ora, non una propria lista di attesa.
 */
export interface CounterQueue {
  counterId: string;
  counterName: string;
  /** Turno chiamato ora a questo sportello (stato `CHIAMATA`); `null` se nessuno. */
  current: QueueBooking | null;
}

/**
 * Dati della dashboard bigliettaio: sportelli aperti (con il turno in chiamata),
 * coda d'attesa **condivisa** e statistica del giorno. Qualsiasi sportello
 * libero preleva il prossimo turno da `waiting`.
 */
export interface CassaQueueData {
  counters: CounterQueue[];
  /** Turni in attesa (`PRENOTATA`/`IN_CODA`), in ordine di chiamata. Condivisa. */
  waiting: QueueBooking[];
  /** Numero di turni serviti oggi (stato `SERVITA`). */
  servedToday: number;
}
