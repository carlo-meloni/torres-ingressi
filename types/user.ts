import type { Role } from "@/generated/prisma/enums";

/** Utente come mostrato nella lista sysadmin (forma serializzabile per il client). */
export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  /** Data di creazione come ISO string (confine server→client). */
  createdAt: string;
}

/**
 * Payload per creazione/aggiornamento di un utente.
 * In creazione `password` è obbligatoria; in modifica è opzionale
 * (vuota → la password resta invariata).
 */
export interface UserInput {
  name?: string;
  email: string;
  role: Role;
  password?: string;
}
