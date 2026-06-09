import { OpeningWindowManager } from "@/components/admin/OpeningWindowManager";
import { prisma } from "@/lib/prisma";
import type {
  CounterOption,
  OpeningWindowListItem,
} from "@/types/opening-window";

/**
 * Gestione aperture (finestre = `OpeningWindow`). Carica lato server le finestre
 * con il nome dello sportello e i conteggi di slot/prenotazioni, più gli
 * sportelli attivi per la select del form; delega apertura/chiusura alle Server
 * Actions in `actions/opening-windows.ts` tramite `OpeningWindowManager`.
 */
export default async function AperturePage() {
  const [windows, activeCounters] = await Promise.all([
    prisma.openingWindow.findMany({
      orderBy: [{ startTime: "desc" }],
      select: {
        id: true,
        counterId: true,
        startTime: true,
        endTime: true,
        slotDuration: true,
        capacity: true,
        counter: { select: { name: true } },
        _count: { select: { slots: true } },
        slots: { select: { _count: { select: { bookings: true } } } },
      },
    }),
    prisma.counter.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const initialWindows: OpeningWindowListItem[] = windows.map((w) => ({
    id: w.id,
    counterId: w.counterId,
    counterName: w.counter.name,
    startTime: w.startTime.toISOString(),
    endTime: w.endTime.toISOString(),
    slotDuration: w.slotDuration,
    capacity: w.capacity,
    slotCount: w._count.slots,
    bookingCount: w.slots.reduce((sum, s) => sum + s._count.bookings, 0),
  }));

  const counterOptions: CounterOption[] = activeCounters.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <OpeningWindowManager
      initialWindows={initialWindows}
      counterOptions={counterOptions}
    />
  );
}
