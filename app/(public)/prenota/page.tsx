import type { Metadata } from "next";
import BookingCalendar from "@/components/public/BookingCalendar";
import { MOCK_WEEK } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Prenota il tuo turno — Torres Biglietteria",
  description:
    "Scegli giorno e orario dal calendario e prenota il tuo turno alla biglietteria della Torres Sassari.",
};

/**
 * Calendario pubblico di prenotazione. Server component: passa i dati (per ora
 * mockati) al calendario interattivo. In futuro leggerà gli slot da Prisma in
 * base alle finestre di apertura attive.
 */
export default function PrenotaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-10 flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
          Prenotazione
        </span>
        <h1 className="text-3xl font-bold text-brand-primary sm:text-4xl">
          Scegli quando passare
        </h1>
        <p className="max-w-xl text-brand-muted">
          Seleziona un giorno con gli sportelli aperti, scegli una fascia oraria
          libera e conferma con i tuoi dati. Riceverai subito il numero del tuo
          turno.
        </p>
      </header>

      <BookingCalendar week={MOCK_WEEK} />
    </div>
  );
}
