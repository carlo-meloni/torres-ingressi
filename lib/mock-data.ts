import type { CalendarDay, CalendarSlot, SlotStatus } from "@/types/booking";

/**
 * Dati mockati per il calendario di prenotazione pubblico.
 *
 * Sostituiranno i dati reali letti da Prisma una volta implementati gli
 * sportelli e le finestre di apertura. La struttura rispecchia già
 * `CalendarDay` / `CalendarSlot` per facilitare il passaggio.
 */

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"] as const;
const MONTHS = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
] as const;

const COUNTERS = ["Sportello 1", "Cassa Tribuna", "Sportello 2"] as const;

/** Derivata dai posti rimasti: la soglia "quasi pieno" è ≤ 2. */
function statusFromSeats(seatsLeft: number): SlotStatus {
  if (seatsLeft <= 0) return "pieno";
  if (seatsLeft <= 2) return "quasi_pieno";
  return "aperto";
}

/** Genera gli slot di una giornata aperta, ogni 10 minuti dalle 10:00. */
function buildSlots(dateKey: string, seatsPattern: number[]): CalendarSlot[] {
  return seatsPattern.map((seatsLeft, i) => {
    const totalMinutes = 10 * 60 + i * 10; // a partire dalle 10:00
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const mm = String(totalMinutes % 60).padStart(2, "0");
    return {
      id: `${dateKey}-${hh}${mm}`,
      time: `${hh}:${mm}`,
      status: statusFromSeats(seatsLeft),
      counterName: COUNTERS[i % COUNTERS.length],
      seatsLeft,
    };
  });
}

/** Stato aggregato della giornata in base agli slot prenotabili. */
function dayStatus(slots: CalendarSlot[]): SlotStatus {
  if (slots.length === 0) return "chiuso";
  const bookable = slots.filter((s) => s.status !== "pieno");
  if (bookable.length === 0) return "pieno";
  if (bookable.some((s) => s.status === "aperto")) return "aperto";
  return "quasi_pieno";
}

/**
 * Pattern di posti rimasti per ciascuna giornata della settimana mockata.
 * Un array vuoto rappresenta una giornata con biglietteria chiusa.
 */
const WEEK_SEATS: number[][] = [
  [5, 4, 3, 5, 2, 1, 4, 3], // lun — aperto
  [], // mar — chiuso
  [4, 3, 5, 2, 1, 5, 4, 3], // mer — aperto
  [2, 1, 1, 0, 2, 1, 0, 2], // gio — quasi pieno
  [0, 0, 1, 0, 0, 2, 0, 0], // ven — pieno
  [5, 5, 4, 3, 5, 4, 3, 2], // sab — aperto
  [], // dom — chiuso
];

/** Costruisce una settimana di giornate a partire dalla data indicata. */
function buildWeek(start: Date): CalendarDay[] {
  return WEEK_SEATS.map((seatsPattern, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);

    const dateKey = date.toISOString().slice(0, 10);
    const slots = buildSlots(dateKey, seatsPattern);

    return {
      date: dateKey,
      weekday: WEEKDAYS[date.getDay()],
      dayNumber: String(date.getDate()),
      month: MONTHS[date.getMonth()],
      status: dayStatus(slots),
      slots,
    };
  });
}

/**
 * Settimana mockata a partire da una data fissa, così il rendering è
 * deterministico (nessun mismatch di hydration tra server e client).
 */
export const MOCK_WEEK: CalendarDay[] = buildWeek(new Date("2026-06-08"));

/** Cerca uno slot in tutta la settimana dato il suo id. */
export function findSlot(
  slotId: string
): { day: CalendarDay; slot: CalendarSlot } | null {
  for (const day of MOCK_WEEK) {
    const slot = day.slots.find((s) => s.id === slotId);
    if (slot) return { day, slot };
  }
  return null;
}
