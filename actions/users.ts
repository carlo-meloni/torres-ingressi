"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { UserInput } from "@/types/user";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// `name` opzionale: stringa vuota → undefined. `role` ristretto all'enum Prisma.
const baseUserSchema = z.object({
  name: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .min(2, "Il nome deve avere almeno 2 caratteri")
      .max(80, "Il nome è troppo lungo (max 80 caratteri)")
      .optional(),
  ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email non valida")
    .max(160, "L'email è troppo lunga"),
  role: z.enum(["SYSADMIN", "ADMIN", "BIGLIETTAIO"]),
});

// In creazione la password è obbligatoria (min 8).
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

// In modifica la password è opzionale: vuota → invariata, altrimenti min 8.
const updateUserSchema = baseUserSchema.extend({
  password: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .min(8, "La password deve avere almeno 8 caratteri")
      .optional(),
  ),
});

/**
 * Guardia RBAC: solo `SYSADMIN` può gestire gli utenti.
 * Ritorna l'utente della sessione, o `null` se non autorizzato.
 */
async function requireSysadmin() {
  const session = await auth();
  if (session?.user?.role !== "SYSADMIN") return null;
  return session.user;
}

/** Crea un nuovo utente con password cifrata. */
export async function createUser(
  input: UserInput,
): Promise<ActionResult<{ id: string; createdAt: string }>> {
  if (!(await requireSysadmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "Un utente con questa email esiste già." };
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name ?? null,
        email: parsed.data.email,
        role: parsed.data.role,
        password: await bcrypt.hash(parsed.data.password, 10),
      },
      select: { id: true, createdAt: true },
    });
    revalidatePath("/admin/utenti");
    return {
      success: true,
      data: { id: user.id, createdAt: user.createdAt.toISOString() },
    };
  } catch {
    return { success: false, error: "Impossibile creare l'utente." };
  }
}

/**
 * Aggiorna un utente. La password si cambia solo se fornita.
 * Un sysadmin non può togliersi da solo il ruolo `SYSADMIN` (evita il lockout).
 */
export async function updateUser(
  id: string,
  input: UserInput,
): Promise<ActionResult<{ id: string }>> {
  const current = await requireSysadmin();
  if (!current) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  if (id === current.id && parsed.data.role !== "SYSADMIN") {
    return {
      success: false,
      error: "Non puoi rimuovere il tuo stesso ruolo di sysadmin.",
    };
  }

  // L'email deve restare unica tra utenti diversi.
  const emailOwner = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (emailOwner && emailOwner.id !== id) {
    return { success: false, error: "Un utente con questa email esiste già." };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name ?? null,
        email: parsed.data.email,
        role: parsed.data.role,
        ...(parsed.data.password
          ? { password: await bcrypt.hash(parsed.data.password, 10) }
          : {}),
      },
    });
    revalidatePath("/admin/utenti");
    return { success: true, data: { id } };
  } catch {
    return { success: false, error: "Impossibile aggiornare l'utente." };
  }
}

/** Elimina un utente. Un sysadmin non può eliminare il proprio account. */
export async function deleteUser(id: string): Promise<ActionResult> {
  const current = await requireSysadmin();
  if (!current) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  if (id === current.id) {
    return { success: false, error: "Non puoi eliminare il tuo account." };
  }

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/utenti");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Impossibile eliminare l'utente." };
  }
}
