/**
 * Generazione degli slot prenotabili da una finestra di apertura.
 *
 * Logica **pura** (nessuna dipendenza da Prisma/Next) così da essere isolata e
 * testabile: dato l'intervallo della finestra e la durata di ogni slot, ritorna
 * gli intervalli `{ startTime, endTime }` allineati alla durata. Gli slot
 * "parziali" in coda — quando l'ultimo non entra interamente nella finestra —
 * vengono scartati.
 */

export interface SlotRange {
  startTime: Date;
  endTime: Date;
}

const MS_PER_MINUTE = 60_000;

/**
 * Genera gli intervalli degli slot di una finestra.
 *
 * Esempio: 10:00 → 12:00 con `slotDurationMinutes = 10` produce 12 slot
 * (10:00–10:10, 10:10–10:20, …, 11:50–12:00).
 *
 * Ritorna `[]` se i parametri non producono almeno uno slot intero
 * (durata ≤ 0, oppure `windowStart` ≥ `windowEnd`).
 */
export function generateSlotRanges({
  windowStart,
  windowEnd,
  slotDurationMinutes,
}: {
  windowStart: Date;
  windowEnd: Date;
  slotDurationMinutes: number;
}): SlotRange[] {
  if (
    !Number.isFinite(slotDurationMinutes) ||
    slotDurationMinutes <= 0 ||
    windowStart.getTime() >= windowEnd.getTime()
  ) {
    return [];
  }

  const stepMs = slotDurationMinutes * MS_PER_MINUTE;
  const endMs = windowEnd.getTime();
  const slots: SlotRange[] = [];

  for (
    let startMs = windowStart.getTime();
    startMs + stepMs <= endMs;
    startMs += stepMs
  ) {
    slots.push({
      startTime: new Date(startMs),
      endTime: new Date(startMs + stepMs),
    });
  }

  return slots;
}
