"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { bookingFormSchema, type BookingFormValues } from "@/lib/schemas/booking";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Dati restituiti dopo una prenotazione andata a buon fine. */
export interface BookingConfirmation {
  ticketNumber: number;
  counterName: string;
  /** Giorno dello slot (`YYYY-MM-DD`, fuso del server). */
  date: string;
  /** Orario dello slot (`HH:mm`). */
  time: string;
}

/** Estremi della giornata locale (00:00 incluso → 00:00 del giorno dopo escluso). */
function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Crea una prenotazione pubblica per una **fascia oraria**. Nessuna
 * autenticazione: la parte pubblica è aperta. Tra gli sportelli aperti a
 * quell'ora sceglie quello **meno carico** (bilanciamento), poi assegna un
 * `ticketNumber` progressivo **per giornata**, il tutto in un'unica transazione.
 *
 * Risolvere lo sportello qui (e non al render del calendario) garantisce che le
 * prenotazioni si distribuiscano tra gli sportelli sullo stato corrente del DB,
 * anche con più richieste ravvicinate.
 *
 * Nota: la numerazione legge il massimo del giorno e poi inserisce; sotto forte
 * concorrenza due richieste potrebbero collidere. Per la scala della
 * biglietteria è accettabile; all'occorrenza si potrà alzare l'isolamento o
 * introdurre una sequenza dedicata.
 */
export async function createBooking(
  input: BookingFormValues,
): Promise<ActionResult<BookingConfirmation>> {
  const parsed = bookingFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }
  const { slotStart, name, email, phone } = parsed.data;
  const startTime = new Date(slotStart);

  if (startTime.getTime() <= Date.now()) {
    return {
      success: false,
      error: "Questo orario è già passato: scegline un altro.",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Tutti gli sportelli (attivi) aperti a quell'istante.
      const candidates = await tx.bookingSlot.findMany({
        where: {
          startTime,
          openingWindow: { counter: { isActive: true } },
        },
        select: {
          id: true,
          capacity: true,
          _count: { select: { bookings: true } },
          openingWindow: { select: { counter: { select: { name: true } } } },
        },
      });

      // Solo quelli con posti liberi; il meno carico per primo (bilanciamento),
      // a parità di carico ordine stabile per id.
      const available = candidates
        .filter((c) => c._count.bookings < c.capacity)
        .sort(
          (a, b) =>
            a._count.bookings - b._count.bookings || a.id.localeCompare(b.id),
        );

      const chosen = available[0];
      if (!chosen) {
        return {
          success: false as const,
          error: "Questo orario è al completo: scegline un altro.",
        };
      }

      // Numero di turno progressivo per giornata.
      const { start, end } = dayBounds(startTime);
      const last = await tx.booking.findFirst({
        where: { slot: { startTime: { gte: start, lt: end } } },
        orderBy: { ticketNumber: "desc" },
        select: { ticketNumber: true },
      });
      const ticketNumber = (last?.ticketNumber ?? 0) + 1;

      await tx.booking.create({
        data: { slotId: chosen.id, name, email, phone, ticketNumber },
      });

      const time = `${String(startTime.getHours()).padStart(2, "0")}:${String(
        startTime.getMinutes(),
      ).padStart(2, "0")}`;
      const date = `${startTime.getFullYear()}-${String(
        startTime.getMonth() + 1,
      ).padStart(2, "0")}-${String(startTime.getDate()).padStart(2, "0")}`;

      revalidatePath("/prenota");
      revalidatePath("/admin/prenotazioni");

      return {
        success: true as const,
        data: {
          ticketNumber,
          counterName: chosen.openingWindow.counter.name,
          date,
          time,
        },
      };
    });
  } catch {
    return { success: false, error: "Impossibile completare la prenotazione." };
  }
}
