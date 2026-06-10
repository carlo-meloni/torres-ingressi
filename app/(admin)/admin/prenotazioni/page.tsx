import { BookingsTable } from "@/components/admin/BookingsTable";
import { prisma } from "@/lib/prisma";
import type {
  BookingCounterOption,
  BookingListItem,
} from "@/types/booking";

/**
 * Elenco prenotazioni (vista admin, sola lettura). Carica lato server tutte le
 * prenotazioni con orario dello slot e lo sportello che le ha **servite** (se
 * già chiamate; lo sportello non è più deciso alla prenotazione), più gli
 * sportelli che compaiono tra le prenotazioni per il filtro; mappa a forma
 * serializzabile e delega filtro/visualizzazione a `<BookingsTable>`.
 *
 * La gestione di coda e cambi di stato resta nella vista bigliettaio `(cassa)`.
 */
export default async function PrenotazioniPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: [{ slot: { startTime: "asc" } }, { ticketNumber: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ticketNumber: true,
      status: true,
      createdAt: true,
      slot: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
      servedByCounter: { select: { id: true, name: true } },
    },
  });

  const initialBookings: BookingListItem[] = bookings.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    phone: b.phone,
    ticketNumber: b.ticketNumber,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    slotStart: b.slot.startTime.toISOString(),
    slotEnd: b.slot.endTime.toISOString(),
    counterId: b.servedByCounter?.id ?? null,
    counterName: b.servedByCounter?.name ?? null,
  }));

  // Sportelli che hanno servito almeno una prenotazione (dedup), in ordine
  // alfabetico — usati per il filtro per sportello.
  const counterOptions: BookingCounterOption[] = Array.from(
    new Map(
      initialBookings
        .filter((b) => b.counterId !== null)
        .map((b) => [
          b.counterId as string,
          { id: b.counterId as string, name: b.counterName as string },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <BookingsTable
      initialBookings={initialBookings}
      counterOptions={counterOptions}
    />
  );
}
