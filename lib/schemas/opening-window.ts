import { z } from "zod";

/**
 * Schema condiviso per l'apertura di una finestra.
 *
 * Usato sia dal form (react-hook-form + `zodResolver`) sia dalla Server Action,
 * così che validazione e messaggi siano identici sui due lati. I campi orario
 * sono stringhe `datetime-local` ("YYYY-MM-DDTHH:mm"); la Server Action le
 * converte in `Date`.
 */
export const openingWindowFormSchema = z
  .object({
    counterId: z.string().min(1, "Seleziona uno sportello."),
    startTime: z
      .string()
      .min(1, "Inserisci l'orario di inizio.")
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "Orario di inizio non valido.",
      }),
    endTime: z
      .string()
      .min(1, "Inserisci l'orario di fine.")
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "Orario di fine non valido.",
      }),
    slotDuration: z
      .number({ message: "Inserisci la durata in minuti." })
      .int("La durata deve essere un numero intero di minuti.")
      .min(1, "La durata minima di uno slot è 1 minuto.")
      .max(240, "La durata massima di uno slot è 240 minuti."),
    capacity: z
      .number({ message: "Inserisci la capacità." })
      .int("La capacità deve essere un numero intero.")
      .min(1, "La capacità minima è 1.")
      .max(100, "La capacità massima è 100."),
  })
  .refine(
    (d) =>
      Number.isNaN(Date.parse(d.startTime)) ||
      Number.isNaN(Date.parse(d.endTime)) ||
      new Date(d.startTime).getTime() < new Date(d.endTime).getTime(),
    {
      message: "L'orario di fine deve essere successivo a quello di inizio.",
      path: ["endTime"],
    },
  );

export type OpeningWindowFormValues = z.infer<typeof openingWindowFormSchema>;
