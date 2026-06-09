/** Sportello come mostrato nella lista admin (forma serializzabile per il client). */
export interface CounterListItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  /** Numero di finestre di apertura associate (blocca l'eliminazione se > 0). */
  openingWindowCount: number;
}

/** Payload per creazione/aggiornamento di uno sportello. */
export interface CounterInput {
  name: string;
  description?: string;
  isActive?: boolean;
}
