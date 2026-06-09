import type { Metadata } from "next";
import QueueDisplay from "@/components/display/QueueDisplay";
import { INITIAL_QUEUE } from "@/lib/mock-queue";

export const metadata: Metadata = {
  title: "Schermo coda — Torres Biglietteria",
  description: "Schermo pubblico della coda della biglietteria Torres Sassari.",
};

/**
 * Schermo pubblico della coda (fullscreen). Pensato per un monitor sempre
 * acceso in biglietteria: numeri giganti, alto contrasto, dark mode.
 *
 * Server component che passa l'istantanea iniziale mockata al display, il
 * quale simula l'avanzamento realtime lato client. Con i dati reali
 * l'istantanea arriverà dal backend e gli aggiornamenti via WebSocket/Pusher.
 */
export default function DisplayPage() {
  return <QueueDisplay initial={INITIAL_QUEUE} />;
}
