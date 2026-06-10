/**
 * Helper di formattazione condivisi.
 *
 * Le date si mostrano **sempre** come `dd/mm/yyyy`; gli orari come `HH:mm`
 * (24h). Centralizzati qui così che la convenzione abbia un'unica sorgente.
 */

const DATE_FMT = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Formatta una data come `dd/mm/yyyy` (es. `10/06/2026`). */
export function formatDate(value: Date | string | number): string {
  return DATE_FMT.format(new Date(value));
}

/** Formatta un orario come `HH:mm` (24h, es. `10:00`). */
export function formatTime(value: Date | string | number): string {
  return TIME_FMT.format(new Date(value));
}

/** Formatta un numero di turno con tre cifre (es. 42 → `042`). */
export function formatTicket(n: number): string {
  return String(n).padStart(3, "0");
}
