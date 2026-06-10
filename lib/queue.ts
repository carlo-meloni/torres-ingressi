import { prisma } from "@/lib/prisma";
import type {
  CassaQueueData,
  CounterQueue,
  QueueBooking,
  QueueSnapshot,
} from "@/types/booking";

/**
 * Lettura della coda del giorno dal DB (solo server).
 *
 * Da un'unica lettura ricava entrambe le forme: `cassa` per la dashboard del
 * bigliettaio e `snapshot` per lo schermo pubblico (anche payload realtime,
 * vedi `lib/realtime.ts`).
 */

/** Estremi della giornata locale (00:00 incluso → 00:00 del giorno dopo escluso). */
function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Stati considerati "in coda" (visibili nella dashboard e nello schermo). */
const ACTIVE_STATUSES = ["PRENOTATA", "IN_CODA", "CHIAMATA"] as const;

/**
 * Costruisce coda bigliettaio + istantanea pubblica per oggi.
 *
 * Sportelli mostrati: quelli attivi con almeno una finestra di apertura che
 * inizia oggi. Le prenotazioni del giorno sono raggruppate per sportello:
 * `current` = il turno `CHIAMATA`, `waiting` = i turni in attesa per
 * `ticketNumber`. L'hero dello schermo (`latestCounterId`) è lo sportello con
 * la chiamata più recente (`updatedAt`).
 */
export async function getQueue(): Promise<{
  cassa: CassaQueueData;
  snapshot: QueueSnapshot;
}> {
  const { start, end } = dayBounds(new Date());

  const [counters, bookings, servedToday] = await Promise.all([
    prisma.counter.findMany({
      where: {
        isActive: true,
        openingWindows: { some: { startTime: { gte: start, lt: end } } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        slot: { startTime: { gte: start, lt: end } },
        status: { in: [...ACTIVE_STATUSES] },
      },
      orderBy: { ticketNumber: "asc" },
      select: {
        id: true,
        name: true,
        ticketNumber: true,
        status: true,
        updatedAt: true,
        slot: {
          select: { openingWindow: { select: { counterId: true } } },
        },
      },
    }),
    prisma.booking.count({
      where: {
        slot: { startTime: { gte: start, lt: end } },
        status: "SERVITA",
      },
    }),
  ]);

  // Raggruppa le prenotazioni attive per sportello.
  const byCounter = new Map<
    string,
    { current: QueueBooking | null; waiting: QueueBooking[] }
  >();
  for (const c of counters) {
    byCounter.set(c.id, { current: null, waiting: [] });
  }

  // Sportello dell'ultima chiamata (CHIAMATA con updatedAt massimo).
  let latestCounterId: string | null = null;
  let latestCalledAt = -Infinity;

  for (const b of bookings) {
    const counterId = b.slot.openingWindow.counterId;
    const bucket = byCounter.get(counterId);
    // Ignora prenotazioni di sportelli non in elenco (es. non aperti oggi).
    if (!bucket) continue;

    const item: QueueBooking = {
      id: b.id,
      ticketNumber: b.ticketNumber,
      name: b.name,
      status: b.status,
    };

    if (b.status === "CHIAMATA") {
      bucket.current = item;
      const calledAt = b.updatedAt.getTime();
      if (calledAt > latestCalledAt) {
        latestCalledAt = calledAt;
        latestCounterId = counterId;
      }
    } else {
      bucket.waiting.push(item);
    }
  }

  const counterQueues: CounterQueue[] = counters.map((c) => {
    const bucket = byCounter.get(c.id)!;
    return {
      counterId: c.id,
      counterName: c.name,
      current: bucket.current,
      waiting: bucket.waiting,
    };
  });

  // Snapshot pubblico: numeri serviti per sportello + prossimi (globali).
  const serving: Record<string, number | null> = {};
  for (const q of counterQueues) {
    serving[q.counterId] = q.current?.ticketNumber ?? null;
  }
  const upcoming = counterQueues
    .flatMap((q) => q.waiting)
    .sort((a, b) => a.ticketNumber - b.ticketNumber)
    .map((b) => b.ticketNumber);

  return {
    cassa: { counters: counterQueues, servedToday },
    snapshot: {
      counters: counters.map((c) => ({ id: c.id, name: c.name })),
      serving,
      latestCounterId,
      upcoming,
    },
  };
}
