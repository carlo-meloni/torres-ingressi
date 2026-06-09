/**
 * Tipi del flusso di prenotazione pubblico.
 *
 * Per ora i dati sono mockati (vedi `lib/mock-data.ts`); queste interfacce
 * rispecchiano il modello dati Prisma (`BookingSlot`, `Booking`) così che il
 * passaggio ai dati reali richieda modifiche minime.
 */

/** Stato di apertura di uno slot nel calendario pubblico. */
export type SlotStatus = "aperto" | "quasi_pieno" | "pieno" | "chiuso";

/** Singolo turno prenotabile mostrato nel calendario. */
export interface CalendarSlot {
  id: string;
  /** Orario di inizio in formato "HH:mm" (es. "10:00"). */
  time: string;
  status: SlotStatus;
  /** Nome dello sportello che serve questo slot (es. "Sportello 1"). */
  counterName: string;
  /** Posti ancora prenotabili in questo slot. */
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
 * Per ora i numeri sono interi mockati e l'avanzamento è simulato lato client
 * (vedi `lib/mock-queue.ts` e `QueueDisplay`). Con i dati reali questa
 * istantanea arriverà dal backend e gli avanzamenti via WebSocket/Pusher.
 */
export interface QueueSnapshot {
  /** Sportelli aperti, in ordine di visualizzazione. */
  counters: DisplayCounter[];
  /** Numero servito ora a ciascuno sportello (per id); `null` se libero. */
  serving: Record<string, number | null>;
  /** Sportello dell'ultima chiamata: è l'hero dello schermo. */
  latestCounterId: string;
  /** Prossimi numeri in coda, in ordine di chiamata. */
  upcoming: number[];
  /** Primo numero ancora non assegnato (alimenta la coda nella simulazione). */
  nextFree: number;
}
