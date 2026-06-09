/**
 * Tipi della gestione aperture (finestre = `OpeningWindow`).
 *
 * Le date attraversano il confine server→client come ISO string: i client
 * component ricevono solo primitivi serializzabili (come `CounterListItem`).
 */

/** Finestra di apertura mostrata nella lista admin. */
export interface OpeningWindowListItem {
  id: string;
  counterId: string;
  counterName: string;
  /** Inizio finestra (ISO string). */
  startTime: string;
  /** Fine finestra (ISO string). */
  endTime: string;
  /** Durata di ogni slot in minuti. */
  slotDuration: number;
  /** Prenotazioni possibili per slot. */
  capacity: number;
  /** Numero di slot generati dalla finestra. */
  slotCount: number;
  /** Prenotazioni associate (blocca la chiusura se > 0). */
  bookingCount: number;
}

/** Sportello selezionabile nel form di apertura. */
export interface CounterOption {
  id: string;
  name: string;
}

/** Payload per l'apertura di una finestra. */
export interface OpeningWindowInput {
  counterId: string;
  /** "YYYY-MM-DDTHH:mm" da un input `datetime-local`. */
  startTime: string;
  /** "YYYY-MM-DDTHH:mm" da un input `datetime-local`. */
  endTime: string;
  slotDuration: number;
  capacity: number;
}
