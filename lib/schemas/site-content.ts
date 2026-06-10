import { z } from "zod";

/**
 * Schema condiviso per i contenuti dell'hero, usato sia dal form (client) sia
 * dalla Server Action, così validazione e messaggi restano identici sui due lati.
 */
export const heroContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Il titolo deve avere almeno 3 caratteri.")
    .max(300, "Il titolo è troppo lungo (max 300 caratteri)."),
  subtitle: z
    .string()
    .trim()
    .min(3, "Il sottotitolo deve avere almeno 3 caratteri.")
    .max(500, "Il sottotitolo è troppo lungo (max 500 caratteri)."),
});

export type HeroContentValues = z.infer<typeof heroContentSchema>;
