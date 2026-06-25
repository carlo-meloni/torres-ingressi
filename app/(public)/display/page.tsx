import type { Metadata } from "next";
import QueueDisplay from "@/components/display/QueueDisplay";
import { getQueue } from "@/lib/queue";

export const metadata: Metadata = {
  title: "Schermo coda",
  description: "Schermo pubblico della coda della biglietteria Torres Sassari.",
};

// Legge la coda corrente a ogni richiesta; gli aggiornamenti arrivano via realtime.
export const dynamic = "force-dynamic";

/**
 * Schermo pubblico della coda (fullscreen). Pensato per un monitor sempre acceso
 * in biglietteria: numeri giganti, alto contrasto, dark mode.
 *
 * Server component che legge l'istantanea iniziale dal DB e la passa al display,
 * il quale si aggiorna in tempo reale via Pusher (evento `queue-updated`).
 */
export default async function DisplayPage() {
  const { snapshot } = await getQueue();
  return <QueueDisplay initial={snapshot} />;
}
