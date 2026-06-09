import type { QueueSnapshot } from "@/types/booking";

/**
 * Dati mockati per lo schermo pubblico della coda.
 *
 * Sostituiranno i dati reali letti dal backend (e gli eventi realtime
 * WebSocket/Pusher) una volta implementate coda e chiamate. La struttura
 * rispecchia già `QueueSnapshot` per facilitare il passaggio.
 */

/** Formatta un numero di turno con tre cifre (es. 42 → "042"). */
export function formatTicket(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Istantanea iniziale deterministica: tre sportelli aperti, ciascuno con un
 * turno in servizio, e una coda di numeri in arrivo. Fissa così da evitare
 * mismatch di hydration tra server e client.
 */
export const INITIAL_QUEUE: QueueSnapshot = {
  counters: [
    { id: "c1", name: "Sportello 1" },
    { id: "c2", name: "Cassa Tribuna" },
    { id: "c3", name: "Sportello 3" },
  ],
  serving: { c1: 40, c2: 41, c3: 42 },
  latestCounterId: "c3",
  upcoming: [43, 44, 45, 46, 47, 48],
  nextFree: 49,
};

/**
 * Avanza la coda di un passo: chiama il primo numero in attesa allo sportello
 * indicato, lo mette in servizio e rifornisce la coda con un nuovo numero.
 * Funzione pura — ritorna una nuova istantanea senza mutare quella in ingresso.
 *
 * È la versione mock di ciò che, con i dati reali, sarà un evento realtime
 * "prossimo chiamato" emesso dalla dashboard del bigliettaio.
 */
export function callNext(
  snapshot: QueueSnapshot,
  counterId: string
): QueueSnapshot {
  const [called, ...rest] = snapshot.upcoming;
  if (called === undefined) return snapshot;

  return {
    ...snapshot,
    serving: { ...snapshot.serving, [counterId]: called },
    latestCounterId: counterId,
    upcoming: [...rest, snapshot.nextFree],
    nextFree: snapshot.nextFree + 1,
  };
}
