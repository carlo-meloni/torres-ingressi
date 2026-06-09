"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { CounterInput } from "@/types/counter";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const counterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Il nome deve avere almeno 2 caratteri")
    .max(80, "Il nome è troppo lungo (max 80 caratteri)"),
  // Stringa vuota → nessuna descrizione.
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .max(280, "La descrizione è troppo lunga (max 280 caratteri)")
      .optional(),
  ),
  isActive: z.boolean().optional(),
});

/**
 * Guardia RBAC: solo `ADMIN`/`SYSADMIN` possono mutare gli sportelli.
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

/** Crea un nuovo sportello. */
export async function createCounter(
  input: CounterInput,
): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  const parsed = counterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  try {
    const counter = await prisma.counter.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        isActive: parsed.data.isActive ?? true,
      },
    });
    revalidatePath("/admin/sportelli");
    return { success: true, data: { id: counter.id } };
  } catch {
    return { success: false, error: "Impossibile creare lo sportello." };
  }
}

/** Aggiorna nome/descrizione/stato di uno sportello esistente. */
export async function updateCounter(
  id: string,
  input: CounterInput,
): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  const parsed = counterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  try {
    await prisma.counter.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
      },
    });
    revalidatePath("/admin/sportelli");
    return { success: true, data: { id } };
  } catch {
    return { success: false, error: "Impossibile aggiornare lo sportello." };
  }
}

/** Attiva/disattiva uno sportello (gli sportelli inattivi non sono apribili). */
export async function toggleCounterActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  try {
    const counter = await prisma.counter.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });
    revalidatePath("/admin/sportelli");
    return { success: true, data: counter };
  } catch {
    return { success: false, error: "Impossibile aggiornare lo sportello." };
  }
}

/**
 * Elimina uno sportello. Rifiuta se ha aperture associate: l'eliminazione a
 * cascata travolgerebbe finestre, turni e prenotazioni. In quel caso si
 * disattiva lo sportello invece di eliminarlo.
 */
export async function deleteCounter(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  try {
    const openingWindowCount = await prisma.openingWindow.count({
      where: { counterId: id },
    });
    if (openingWindowCount > 0) {
      return {
        success: false,
        error:
          "Lo sportello ha aperture associate: disattivalo invece di eliminarlo.",
      };
    }

    await prisma.counter.delete({ where: { id } });
    revalidatePath("/admin/sportelli");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Impossibile eliminare lo sportello." };
  }
}
