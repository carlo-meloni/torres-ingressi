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
 * inizia oggi. La coda d'attesa è **condivisa**: i turni `PRENOTATA`/`IN_CODA`
 * formano un'unica lista per `ticketNumber`, da cui qualunque sportello libero
 * preleva. Per ogni sportello `current` è il turno che sta chiamando ora
 * (`CHIAMATA` con `servedByCounterId` = quello sportello). L'hero dello schermo
 * (`latestCounterId`) è lo sportello con la chiamata più recente (`updatedAt`).
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
        servedByCounterId: true,
      },
    }),
    prisma.booking.count({
      where: {
        slot: { startTime: { gte: start, lt: end } },
        status: "SERVITA",
      },
    }),
  ]);

  // Turno in chiamata per sportello (CHIAMATA → servedByCounterId) + coda
  // d'attesa condivisa (PRENOTATA/IN_CODA), già ordinata per ticketNumber.
  const currentByCounter = new Map<string, QueueBooking>();
  const waiting: QueueBooking[] = [];

  // Sportello dell'ultima chiamata (CHIAMATA con updatedAt massimo).
  let latestCounterId: string | null = null;
  let latestCalledAt = -Infinity;

  for (const b of bookings) {
    const item: QueueBooking = {
      id: b.id,
      ticketNumber: b.ticketNumber,
      name: b.name,
      status: b.status,
    };

    if (b.status === "CHIAMATA") {
      // Una chiamata senza sportello non dovrebbe esistere (callNext lo imposta
      // sempre); per sicurezza la ignoriamo dalle card per sportello.
      if (!b.servedByCounterId) continue;
      currentByCounter.set(b.servedByCounterId, item);
      const calledAt = b.updatedAt.getTime();
      if (calledAt > latestCalledAt) {
        latestCalledAt = calledAt;
        latestCounterId = b.servedByCounterId;
      }
    } else {
      waiting.push(item);
    }
  }

  const counterQueues: CounterQueue[] = counters.map((c) => ({
    counterId: c.id,
    counterName: c.name,
    current: currentByCounter.get(c.id) ?? null,
  }));

  // Snapshot pubblico: numero in chiamata per sportello + prossimi (condivisi).
  const serving: Record<string, number | null> = {};
  for (const c of counters) {
    serving[c.id] = currentByCounter.get(c.id)?.ticketNumber ?? null;
  }
  const upcoming = waiting.map((b) => b.ticketNumber);

  return {
    cassa: { counters: counterQueues, waiting, servedToday },
    snapshot: {
      counters: counters.map((c) => ({ id: c.id, name: c.name })),
      serving,
      latestCounterId,
      upcoming,
    },
  };
}
