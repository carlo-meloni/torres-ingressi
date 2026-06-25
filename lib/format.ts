/**
 * Helper di formattazione condivisi.
 *
 * Le date si mostrano **sempre** come `dd/mm/yyyy`; gli orari come `HH:mm`
 * (24h). Centralizzati qui così che la convenzione abbia un'unica sorgente.
 *
 * Il fuso è fissato a `Europe/Rome` ([[APP_TIME_ZONE]]): un istante è sempre
 * reso in ora italiana, a prescindere dal fuso del dispositivo di chi guarda.
 */
import { APP_TIME_ZONE } from "@/lib/timezone";

const DATE_FMT = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const TIME_FMT = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
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
