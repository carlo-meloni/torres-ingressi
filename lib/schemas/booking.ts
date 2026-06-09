import { z } from "zod";

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
