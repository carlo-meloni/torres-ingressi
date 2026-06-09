/**
 * Colori principali del brand Torres Biglietteria.
 * Usare questi token in tutto il progetto invece di hardcodare valori esadecimali.
 *
 * Per le classi Tailwind corrispondenti vedi `@theme` in `app/globals.css`
 * (es. `bg-brand-primary`, `text-brand-accent`, `bg-brand-surface`).
 */
export const COLORS = {
  /** Blu navy — colore primario */
  primary: "#16264f",
  /** Rosso — colore d'accento */
  accent: "#b93114",
  /** Grigio chiaro — superfici / sfondo */
  surface: "#edeef2",
} as const;

export type ColorKey = keyof typeof COLORS;
