import type { SlotStatus } from "@/types/booking";

/**
 * Metadati di presentazione per ogni stato di slot: etichetta leggibile,
 * classe del pallino colorato (token `status-*`) e se è prenotabile.
 * Le classi sono letterali così che Tailwind v4 le rilevi a build time.
 */
export const SLOT_STATUS_META: Record<
  SlotStatus,
  { label: string; dot: string; selectable: boolean }
> = {
  aperto: { label: "Disponibile", dot: "bg-status-open", selectable: true },
  quasi_pieno: {
    label: "Quasi pieno",
    dot: "bg-status-almost",
    selectable: true,
  },
  pieno: { label: "Completo", dot: "bg-status-full", selectable: false },
  chiuso: { label: "Chiuso", dot: "bg-status-closed", selectable: false },
};

/** Ordine di legenda mostrato sopra il selettore degli slot. */
export const STATUS_LEGEND: SlotStatus[] = [
  "aperto",
  "quasi_pieno",
  "pieno",
  "chiuso",
];
