"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openingWindowFormSchema } from "@/lib/schemas/opening-window";
import { generateSlotRanges } from "@/lib/slots";
import type { OpeningWindowInput } from "@/types/opening-window";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Guardia RBAC: solo `ADMIN`/`SYSADMIN` possono aprire/chiudere finestre.
 * Ritorna `null` se la sessione non è autorizzata.
 */
async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "SYSADMIN")) {
    return null;
  }
  return session.user;
}

/**
 * Apre una finestra su uno sportello e genera i relativi slot in un'unica
 * transazione: se la generazione fallisce non resta una finestra orfana.
 */
export async function createOpeningWindow(
  input: OpeningWindowInput,
): Promise<ActionResult<{ id: string; slotCount: number }>> {
  const user = await requireAdmin();
  if (!user) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  const parsed = openingWindowFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }
  const { counterId, slotDuration, capacity } = parsed.data;
  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  // Lo sportello deve esistere ed essere attivo.
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    select: { isActive: true },
  });
  if (!counter) {
    return { success: false, error: "Sportello non trovato." };
  }
  if (!counter.isActive) {
    return {
      success: false,
      error: "Lo sportello è disattivato: riattivalo prima di aprire finestre.",
    };
  }

  // Niente sovrapposizioni con altre finestre dello stesso sportello.
  const overlap = await prisma.openingWindow.findFirst({
    where: {
      counterId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
  if (overlap) {
    return {
      success: false,
      error: "La finestra si sovrappone a un'altra apertura dello sportello.",
    };
  }

  const slotRanges = generateSlotRanges({
    windowStart: startTime,
    windowEnd: endTime,
    slotDurationMinutes: slotDuration,
  });
  if (slotRanges.length === 0) {
    return {
      success: false,
      error: "L'intervallo è troppo breve per generare anche un solo slot.",
    };
  }

  try {
    const window = await prisma.$transaction(async (tx) => {
      const created = await tx.openingWindow.create({
        data: {
          counterId,
          startTime,
          endTime,
          slotDuration,
          capacity,
          openedById: user.id,
        },
        select: { id: true },
      });
      await tx.bookingSlot.createMany({
        data: slotRanges.map((s) => ({
          openingWindowId: created.id,
          startTime: s.startTime,
          endTime: s.endTime,
          capacity,
        })),
      });
      return created;
    });

    revalidatePath("/admin/aperture");
    return { success: true, data: { id: window.id, slotCount: slotRanges.length } };
  } catch {
    return { success: false, error: "Impossibile aprire la finestra." };
  }
}

/**
 * Chiude (elimina) una finestra. Rifiuta se ha prenotazioni associate:
 * l'eliminazione a cascata travolgerebbe slot e prenotazioni.
 */
export async function deleteOpeningWindow(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  try {
    const bookingCount = await prisma.booking.count({
      where: { slot: { openingWindowId: id } },
    });
    if (bookingCount > 0) {
      return {
        success: false,
        error:
          "La finestra ha prenotazioni associate: non può essere chiusa.",
      };
    }

    await prisma.openingWindow.delete({ where: { id } });
    revalidatePath("/admin/aperture");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Impossibile chiudere la finestra." };
  }
}
