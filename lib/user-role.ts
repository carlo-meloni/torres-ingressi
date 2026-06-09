import type { Role } from "@/generated/prisma/enums";

/**
 * Metadati di presentazione per i ruoli (etichetta + classi badge).
 * Le classi sono **letterali** così che Tailwind v4 le includa nel bundle.
 */
export const ROLE_META: Record<
  Role,
  { label: string; description: string; badge: string }
> = {
  SYSADMIN: {
    label: "Sysadmin",
    description: "Accesso completo, gestione utenti e configurazione.",
    badge: "bg-brand-accent/10 text-brand-accent",
  },
  ADMIN: {
    label: "Admin",
    description: "Apre sportelli, gestisce coda e vede le prenotazioni.",
    badge: "bg-brand-primary/10 text-brand-primary",
  },
  BIGLIETTAIO: {
    label: "Bigliettaio",
    description: "Gestisce la coda e vede le prenotazioni.",
    badge: "bg-brand-surface-muted text-brand-muted",
  },
};

/** Ordine dei ruoli dal più al meno privilegiato (per select ed elenchi). */
export const ROLE_ORDER: Role[] = ["SYSADMIN", "ADMIN", "BIGLIETTAIO"];
