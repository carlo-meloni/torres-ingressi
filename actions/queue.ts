"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQueue } from "@/lib/queue";
import { emitQueueUpdate } from "@/lib/realtime";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const idSchema = z.string().min(1);

/**
 * Guardia RBAC della coda: la gestiscono `BIGLIETTAIO`, `ADMIN` e `SYSADMIN`
 * (cioè qualsiasi utente autenticato). Ritorna l'utente, o `null` se non lo è.
 */
async function requireQueueAccess() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Dopo una mutazione: ricarica la coda, emette l'istantanea via realtime e
 * rivalida le pagine server (cassa + schermo pubblico) così che anche il client
 * che ha agito veda subito i dati freschi, a prescindere da Pusher.
 */
async function broadcastQueue(): Promise<void> {
  const { snapshot } = await getQueue();
  await emitQueueUpdate(snapshot);
  revalidatePath("/coda");
  revalidatePath("/display");
}

/**
 * Chiama il prossimo turno a uno sportello dalla coda **condivisa**. Se c'è già
 * un turno chiamato a questo sportello lo conclude (`SERVITA`) — "prossimo"
 * implica che il corrente è servito — poi mette `CHIAMATA` il primo turno in
 * attesa di oggi (ticket più basso), assegnandogli questo sportello.
 *
 * Coda FIFO pura: si chiama sempre il prossimo in lista, a prescindere
 * dall'orario prenotato (l'orario resta quello "ideale", ma uno sportello
 * libero può servire chiunque sia in attesa). La coda non è segmentata per
 * sportello: qualunque sportello libero preleva dalla stessa lista, così le
 * prenotazioni si distribuiscono in base agli sportelli effettivamente liberi.
 * Tutto in transazione per evitare che due chiamate concorrenti scelgano lo
 * stesso turno.
 */
export async function callNext(
  counterId: string,
): Promise<ActionResult<{ ticketNumber: number }>> {
  const user = await requireQueueAccess();
  if (!user) return { success: false, error: "Non autorizzato." };

  const parsed = idSchema.safeParse(counterId);
  if (!parsed.success) return { success: false, error: "Sportello non valido." };

  // Estremi di oggi: la coda è per giornata.
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Concludi l'eventuale turno chiamato ora a questo sportello.
      await tx.booking.updateMany({
        where: {
          servedByCounterId: parsed.data,
          status: "CHIAMATA",
          slot: { startTime: { gte: start, lt: end } },
        },
        data: { status: "SERVITA" },
      });

      // Primo turno in attesa (ticket più basso) della coda condivisa di oggi.
      const next = await tx.booking.findFirst({
        where: {
          status: { in: ["PRENOTATA", "IN_CODA"] },
          slot: { startTime: { gte: start, lt: end } },
        },
        orderBy: { ticketNumber: "asc" },
        select: { id: true, ticketNumber: true },
      });
      if (!next) return null;

      await tx.booking.update({
        where: { id: next.id },
        data: {
          status: "CHIAMATA",
          servedById: user.id,
          servedByCounterId: parsed.data,
        },
      });

      return next;
    });

    if (!result) {
      return { success: false, error: "Nessun turno in attesa." };
    }

    await broadcastQueue();
    return { success: true, data: { ticketNumber: result.ticketNumber } };
  } catch {
    return { success: false, error: "Impossibile chiamare il prossimo turno." };
  }
}

/** Segna come servito il turno chiamato (`CHIAMATA → SERVITA`). */
export async function markServed(bookingId: string): Promise<ActionResult> {
  return updateCalledBooking(bookingId, "SERVITA");
}

/** Segna come saltato il turno chiamato (`CHIAMATA → SALTATA`). */
export async function markSkipped(bookingId: string): Promise<ActionResult> {
  return updateCalledBooking(bookingId, "SALTATA");
}

/**
 * Porta un turno **chiamato** a uno stato terminale. Aggiorna solo se la
 * prenotazione è in `CHIAMATA` (evita transizioni fuori sequenza, es. su un
 * turno già concluso da un altro bigliettaio).
 */
async function updateCalledBooking(
  bookingId: string,
  status: "SERVITA" | "SALTATA",
): Promise<ActionResult> {
  const user = await requireQueueAccess();
  if (!user) return { success: false, error: "Non autorizzato." };

  const parsed = idSchema.safeParse(bookingId);
  if (!parsed.success) {
    return { success: false, error: "Prenotazione non valida." };
  }

  try {
    const { count } = await prisma.booking.updateMany({
      where: { id: parsed.data, status: "CHIAMATA" },
      data: {
        status,
        ...(status === "SERVITA" ? { servedById: user.id } : {}),
      },
    });

    if (count === 0) {
      return { success: false, error: "Turno non più in chiamata." };
    }

    await broadcastQueue();
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Impossibile aggiornare il turno." };
  }
}
