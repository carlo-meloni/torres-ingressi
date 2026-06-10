import Pusher from "pusher";

import type { QueueSnapshot } from "@/types/booking";

/**
 * Realtime lato server (Pusher).
 *
 * Ogni cambio di stato della coda emette `QUEUE_UPDATED` sul canale `QUEUE_CHANNEL`
 * con l'istantanea aggiornata: lo schermo pubblico la consuma direttamente, la
 * dashboard bigliettaio la usa come "ping" per ricaricare i dati.
 *
 * Solo server: importa il SDK `pusher` (Node), va usato unicamente da Server
 * Actions/route. Il client `pusher-js` vive in `lib/use-queue-channel.ts`.
 */

/** Canale pubblico della coda. */
export const QUEUE_CHANNEL = "coda";
/** Evento emesso a ogni aggiornamento della coda. */
export const QUEUE_UPDATED = "queue-updated";

let cached: Pusher | null | undefined;

/**
 * Client Pusher singleton dalle env, oppure `null` se non configurato. Senza
 * chiavi il realtime è semplicemente disattivato (l'app continua a funzionare
 * via `revalidatePath`): comodo in dev e in build senza credenziali.
 */
function getPusherServer(): Pusher | null {
  if (cached !== undefined) return cached;

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } =
    process.env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    cached = null;
    return cached;
  }

  cached = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return cached;
}

/**
 * Emette l'istantanea della coda a tutti i client sottoscritti. Best-effort: un
 * guasto di Pusher non deve mai far fallire la mutazione che l'ha generata.
 */
export async function emitQueueUpdate(snapshot: QueueSnapshot): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(QUEUE_CHANNEL, QUEUE_UPDATED, snapshot);
  } catch (error) {
    console.error("[realtime] emit coda fallita:", error);
  }
}
