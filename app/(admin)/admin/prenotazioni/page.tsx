import { BookingsTable } from "@/components/admin/BookingsTable";
import { prisma } from "@/lib/prisma";
import type {
  BookingCounterOption,
  BookingListItem,
} from "@/types/booking";

/**
 * Elenco prenotazioni (vista admin, sola lettura). Carica lato server tutte le
 * prenotazioni con orario dello slot e sportello di riferimento, più gli
 * sportelli che hanno almeno una prenotazione per il filtro; mappa a forma
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
          openingWindow: {
            select: { counter: { select: { id: true, name: true } } },
          },
        },
      },
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
    counterId: b.slot.openingWindow.counter.id,
    counterName: b.slot.openingWindow.counter.name,
  }));

  // Sportelli presenti tra le prenotazioni (dedup), in ordine alfabetico.
  const counterOptions: BookingCounterOption[] = Array.from(
    new Map(
      initialBookings.map((b) => [
        b.counterId,
        { id: b.counterId, name: b.counterName },
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
