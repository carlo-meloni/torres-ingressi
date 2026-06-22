import { prisma } from "@/lib/prisma";
import { earliestBookableTime } from "@/lib/schemas/booking";
import type { CalendarDay, CalendarSlot, SlotStatus } from "@/types/booking";

/**
 * Costruzione del calendario pubblico a partire dai dati reali (Prisma).
 *
 * Legge gli slot futuri degli sportelli attivi, ne calcola i posti rimasti
 * (capacità − prenotazioni) e li raggruppa per giornata nella forma
 * `CalendarDay`/`CalendarSlot` attesa dal calendario. Sostituisce i dati
 * mockati di `lib/mock-data.ts`.
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

/** Derivata dai posti rimasti: la soglia "quasi pieno" è ≤ 2. */
function statusFromSeats(seatsLeft: number): SlotStatus {
  if (seatsLeft <= 0) return "pieno";
  if (seatsLeft <= 2) return "quasi_pieno";
  return "aperto";
}

/**
 * Stato aggregato della giornata. A livello di giornata distinguiamo solo tre
 * casi — `aperto` (c'è almeno un posto), `pieno` (tutto esaurito), `chiuso`
 * (nessuno slot): il dettaglio "quasi pieno" ha senso sulla singola fascia, non
 * sull'intera giornata.
 */
function dayStatus(slots: CalendarSlot[]): SlotStatus {
  if (slots.length === 0) return "chiuso";
  return slots.some((s) => s.status !== "pieno") ? "aperto" : "pieno";
}

/** Chiave di giornata locale (`YYYY-MM-DD`) di una data. */
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Orario `HH:mm` (24h) di una data, nel fuso del server. */
function timeLabel(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Ritorna le giornate prenotabili (con almeno uno slot futuro) degli sportelli
 * attivi, ciascuna con i propri slot e lo stato aggregato. Le giornate sono in
 * ordine cronologico; il calendario sceglie da sola la prima utile.
 */
export async function getBookingCalendar(): Promise<CalendarDay[]> {
  const slots = await prisma.bookingSlot.findMany({
    where: {
      // Solo fasce con almeno 4 ore di anticipo (vedi `earliestBookableTime`).
      startTime: { gte: earliestBookableTime() },
      openingWindow: { counter: { isActive: true } },
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      startTime: true,
      capacity: true,
      _count: { select: { bookings: true } },
    },
  });

  // Unisci gli slot che cadono allo stesso istante (più sportelli aperti alla
  // stessa ora = un'unica fascia con i posti sommati). `slots` è già ordinato
  // per `startTime`, quindi le fasce risultano in ordine cronologico.
  const byTime = new Map<number, { startTime: Date; seatsLeft: number }>();
  for (const slot of slots) {
    const seatsLeft = Math.max(0, slot.capacity - slot._count.bookings);
    const t = slot.startTime.getTime();
    const entry = byTime.get(t);
    if (entry) {
      entry.seatsLeft += seatsLeft;
    } else {
      byTime.set(t, { startTime: slot.startTime, seatsLeft });
    }
  }

  // Una fascia → un `CalendarSlot`; poi raggruppa per giornata. L'`id` è
  // l'istante ISO della fascia (non un singolo sportello): la scelta dello
  // sportello avviene in `createBooking`, che bilancia tra quelli aperti.
  const byDay = new Map<string, { date: Date; slots: CalendarSlot[] }>();
  for (const { startTime, seatsLeft } of byTime.values()) {
    const calendarSlot: CalendarSlot = {
      id: startTime.toISOString(),
      time: timeLabel(startTime),
      status: statusFromSeats(seatsLeft),
      seatsLeft,
    };
    const key = dayKey(startTime);
    const day = byDay.get(key);
    if (day) {
      day.slots.push(calendarSlot);
    } else {
      byDay.set(key, { date: startTime, slots: [calendarSlot] });
    }
  }

  return Array.from(byDay.entries()).map(([key, { date, slots }]) => ({
    date: key,
    weekday: WEEKDAYS[date.getDay()],
    dayNumber: String(date.getDate()),
    month: MONTHS[date.getMonth()],
    status: dayStatus(slots),
    slots,
  }));
}
