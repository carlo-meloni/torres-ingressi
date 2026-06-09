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
  /** Oro/bronzo dello stemma — hairline e accenti caldi su superfici scure */
  gold: "#c8a96a",
  /** Grigio chiarissimo — superfici / sfondo */
  surface: "#f4f5f8",
  /** Grigio chiaro — superfici secondarie / bordi */
  surfaceMuted: "#e6e8ef",
  /** Grigio testo secondario (contrasto AA su sfondo chiaro) */
  muted: "#5b6478",
} as const;

export type ColorKey = keyof typeof COLORS;

/**
 * Colori che comunicano lo stato di apertura di uno slot nel calendario
 * pubblico. Classi Tailwind corrispondenti: `bg-status-open`, ecc.
 */
export const STATUS_COLORS = {
  /** Verde — sportello aperto, slot prenotabile */
  open: "#10b981",
  /** Ambra — pochi posti rimasti */
  almost: "#f59e0b",
  /** Rosso — slot al completo, non prenotabile */
  full: "#ef4444",
  /** Grigio — biglietteria chiusa in quella fascia */
  closed: "#6b7280",
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;
