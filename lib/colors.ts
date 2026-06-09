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
  /** Navy più scuro — gradienti / hover su superfici scure */
  primaryDark: "#0d1733",
  /** Navy più chiaro — bordi e accenti su superfici scure */
  primaryLight: "#24407f",
  /** Rosso — colore d'accento */
  accent: "#b93114",
  /** Rosso più scuro — hover dell'accento */
  accentHover: "#9c2810",
  /** Grigio chiarissimo — superfici / sfondo */
  surface: "#f4f5f8",
  /** Grigio chiaro — superfici secondarie / bordi */
  surfaceMuted: "#e6e8ef",
  /** Grigio testo secondario (contrasto AA su sfondo chiaro) */
  muted: "#5b6478",
} as const;

export type ColorKey = keyof typeof COLORS;
