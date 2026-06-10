"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  heroContentSchema,
  type HeroContentValues,
} from "@/lib/schemas/site-content";
import { SITE_SETTING_ID } from "@/lib/site-content";

/** Esito uniforme delle Server Actions (vedi coding-standards: `{ success, data, error }`). */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Guardia RBAC: solo `SYSADMIN` può modificare i contenuti del sito.
 * Ritorna `true` se autorizzato.
 */
async function requireSysadmin() {
  const session = await auth();
  return session?.user?.role === "SYSADMIN";
}

/** Aggiorna i testi dell'hero della landing pubblica (riga singleton). */
export async function updateHeroContent(
  input: HeroContentValues,
): Promise<ActionResult<{ updatedAt: string }>> {
  if (!(await requireSysadmin())) {
    return { success: false, error: "Non sei autorizzato a questa operazione." };
  }

  const parsed = heroContentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi.",
    };
  }

  try {
    const setting = await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: {
        id: SITE_SETTING_ID,
        heroTitle: parsed.data.title,
        heroSubtitle: parsed.data.subtitle,
      },
      update: {
        heroTitle: parsed.data.title,
        heroSubtitle: parsed.data.subtitle,
      },
      select: { updatedAt: true },
    });

    revalidatePath("/");
    revalidatePath("/admin/contenuti");

    return {
      success: true,
      data: { updatedAt: setting.updatedAt.toISOString() },
    };
  } catch {
    return { success: false, error: "Impossibile salvare i contenuti." };
  }
}
