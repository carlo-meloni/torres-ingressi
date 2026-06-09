import { CounterManager } from "@/components/admin/CounterManager";
import { prisma } from "@/lib/prisma";
import type { CounterListItem } from "@/types/counter";

/**
 * Gestione sportelli (sportelli = `Counter`). Carica la lista lato server e
 * delega creazione/modifica/eliminazione alle Server Actions in
 * `actions/counters.ts` tramite il componente client `CounterManager`.
 */
export default async function SportelliPage() {
  const counters = await prisma.counter.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      _count: { select: { openingWindows: true } },
    },
  });

  const initialCounters: CounterListItem[] = counters.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    isActive: c.isActive,
    openingWindowCount: c._count.openingWindows,
  }));

  return <CounterManager initialCounters={initialCounters} />;
}
