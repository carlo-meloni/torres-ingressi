"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { bookingFormSchema, type BookingFormValues } from "@/lib/schemas/booking";
import { checkRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Dati restituiti dopo una prenotazione andata a buon fine. */
export interface BookingConfirmation {
  ticketNumber: number;
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
 * autenticazione: la parte pubblica è aperta. La prenotazione **non** viene
 * assegnata a uno sportello: lo sportello verrà deciso al momento della
 * chiamata, quando uno sportello libero preleva il prossimo turno dalla coda
 * condivisa. Qui si occupa solo un posto della capacità della fascia (lo slot
 * meno carico, per bilanciare i contatori) e si assegna un `ticketNumber`
 * progressivo **per giornata**, il tutto in un'unica transazione.
 *
 * Lo slot scelto serve unicamente da "secchiello" di capacità/orario: non
 * vincola più chi servirà il tifoso.
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

  // Anti-spam: la prenotazione è pubblica e senza autenticazione. Una sola
  // prenotazione ogni 10 minuti per IP, a prescindere dall'email, per fermare
  // lo scripting di turni. Fail-open se Upstash non è attivo.
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("booking", ip);
  if (!rl.success) {
    return { success: false, error: rateLimitMessage(rl.reset) };
  }

  const startTime = new Date(slotStart);

  if (startTime.getTime() <= Date.now()) {
    return {
      success: false,
      error: "Questo orario è già passato: scegline un altro.",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Slot (di sportelli attivi) aperti a quell'istante: secchielli di
      // capacità per la fascia, non lo sportello che servirà il tifoso.
      const candidates = await tx.bookingSlot.findMany({
        where: {
          startTime,
          openingWindow: { counter: { isActive: true } },
        },
        select: {
          id: true,
          capacity: true,
          _count: { select: { bookings: true } },
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
          date,
          time,
        },
      };
    });
  } catch {
    return { success: false, error: "Impossibile completare la prenotazione." };
  }
}
