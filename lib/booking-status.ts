import type { BookingStatusValue } from "@/types/booking";

/**
 * Metadati di presentazione per ogni stato di prenotazione: etichetta leggibile
 * e classi del badge (mappate sui token brand/status). Le classi sono letterali
 * così che Tailwind v4 le rilevi a build time (come `SLOT_STATUS_META`).
 */
export const BOOKING_STATUS_META: Record<
  BookingStatusValue,
  { label: string; badge: string }
> = {
  PRENOTATA: {
    label: "Prenotata",
    badge: "border-brand-primary/20 bg-brand-primary/5 text-brand-primary",
  },
  IN_CODA: {
    label: "In coda",
    badge: "border-status-almost/30 bg-status-almost/10 text-status-almost",
  },
  CHIAMATA: {
    label: "Chiamata",
    badge: "border-brand-accent/30 bg-brand-accent/10 text-brand-accent",
  },
  SERVITA: {
    label: "Servita",
    badge: "border-status-open/30 bg-status-open/10 text-status-open",
  },
  SALTATA: {
    label: "Saltata",
    badge: "border-status-full/30 bg-status-full/10 text-status-full",
  },
};

/** Ordine degli stati nel filtro (segue il ciclo di vita della prenotazione). */
export const BOOKING_STATUS_ORDER: BookingStatusValue[] = [
  "PRENOTATA",
  "IN_CODA",
  "CHIAMATA",
  "SERVITA",
  "SALTATA",
];
