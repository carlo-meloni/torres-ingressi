import { z } from "zod";

/**
 * Anticipo minimo per prenotare: una fascia è prenotabile solo se inizia almeno
 * 4 ore dopo l'istante corrente (es. alle 15:00 si può prenotare dalle 19:00 in
 * poi). Condiviso tra il calcolo del calendario e la Server Action di creazione.
 */
export const BOOKING_LEAD_TIME_MS = 4 * 60 * 60 * 1000;

/** Istante minimo prenotabile a partire da `now` (default: adesso). */
export function earliestBookableTime(now: Date = new Date()): Date {
  return new Date(now.getTime() + BOOKING_LEAD_TIME_MS);
}

/**
 * Schema condiviso per la creazione di una prenotazione pubblica.
 *
 * Usato sia dal form (`/prenota`) sia dalla Server Action `createBooking`, così
 * che validazione e messaggi siano identici sui due lati. `email` e `phone`
 * sono opzionali (la stringa vuota viene normalizzata a `undefined`).
 */
const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const bookingFormSchema = z.object({
  /**
   * Istante della fascia oraria scelta (ISO). Non identifica un singolo
   * sportello: la Server Action sceglie lo sportello meno carico a quell'ora,
   * così le prenotazioni si distribuiscono tra gli sportelli aperti.
   */
  slotStart: z
    .string()
    .min(1, "Seleziona un orario.")
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Orario non valido.",
    }),
  name: z.string().trim().min(2, "Inserisci il tuo nome."),
  email: optionalString.pipe(
    z.string().email("Inserisci un'email valida.").optional(),
  ),
  phone: optionalString,
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
