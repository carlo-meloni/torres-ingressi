import { prisma } from "@/lib/prisma";

/** Id fisso della riga singleton `SiteSetting`. */
export const SITE_SETTING_ID = "default";

/**
 * Contenuti dell'hero della landing pubblica. Il titolo è multilinea: ogni
 * `\n` diventa un a capo nel rendering (`whitespace-pre-line`).
 */
export interface HeroContent {
  title: string;
  subtitle: string;
}

/** Testi predefiniti, usati come fallback finché il SYSADMIN non li modifica. */
export const DEFAULT_HERO: HeroContent = {
  title: [
    "Prelazione Abbonamenti 2026-2027",
    "Viale Umberto 26 - Sassari (Hubinsula)",
    "Dal 15 Luglio",
    "17:00 - 20:00",
  ].join("\n"),
  subtitle:
    "Scegli giorno e orario dal calendario: riceverai il tuo numero di turno e saprai esattamente quando passare allo sportello.",
};

/** Legge i contenuti dell'hero, con fallback ai default se non ancora salvati. */
export async function getHeroContent(): Promise<HeroContent> {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { heroTitle: true, heroSubtitle: true },
  });

  return {
    title: setting?.heroTitle ?? DEFAULT_HERO.title,
    subtitle: setting?.heroSubtitle ?? DEFAULT_HERO.subtitle,
  };
}
