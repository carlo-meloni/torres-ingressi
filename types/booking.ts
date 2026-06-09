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
