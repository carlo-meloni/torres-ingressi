import type { Metadata } from "next";

import { QueuePanel } from "@/components/cassa/QueuePanel";
import { getQueue } from "@/lib/queue";

export const metadata: Metadata = {
  title: "Coda — Torres Cassa",
  description: "Gestione della coda della biglietteria Torres Sassari.",
};

// Legge lo stato corrente della coda a ogni richiesta (auth + dati in tempo reale).
export const dynamic = "force-dynamic";

/**
 * Dashboard del bigliettaio: carica lato server la coda del giorno (sportelli
 * aperti, turni in chiamata e in attesa) e la passa a `<QueuePanel>`, che gestisce
 * azioni e aggiornamenti realtime.
 */
export default async function CodaPage() {
  const { cassa } = await getQueue();
  return <QueuePanel initial={cassa} />;
}
