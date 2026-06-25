import type { Metadata } from "next";
import BookingCalendar from "@/components/public/BookingCalendar";
import { getBookingCalendar } from "@/lib/booking-calendar";

export const metadata: Metadata = {
  title: "Prenota il tuo turno",
  description:
    "Scegli giorno e orario dal calendario e prenota il tuo turno alla biglietteria della Torres Sassari.",
};

// La disponibilità degli slot cambia a ogni prenotazione: niente prerender
// statico, la pagina si renderizza a ogni richiesta sui dati reali.
export const dynamic = "force-dynamic";

/**
 * Calendario pubblico di prenotazione. Server component: legge gli slot reali
 * dalle finestre di apertura attive (`getBookingCalendar`) e li passa al
 * calendario interattivo. Se non ci sono giornate prenotabili, mostra un avviso.
 */
export default async function PrenotaPage() {
  const week = await getBookingCalendar();

  return (
    <div className="relative isolate overflow-hidden min-h-[calc(100vh-12rem)] ">
      {/* Bagliori decorativi dietro l'intestazione (puramente estetici) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px -z-10 h-80 bg-linear-to-b from-white to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-144 -translate-x-1/2 rounded-full bg-brand-primary/6 blur-3xl"
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-20">
        <header className="reveal mb-10 flex flex-col items-start gap-4 sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-surface-muted bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-brand-accent" aria-hidden />
            Prenotazione
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] text-brand-primary sm:text-5xl">
            Scegli quando passare
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
            Seleziona un giorno con gli sportelli aperti, scegli una fascia
            oraria libera e conferma con i tuoi dati. Riceverai subito il numero
            del tuo turno.
          </p>
        </header>

        <div className="reveal reveal-1">
          {week.length > 0 ? (
            <BookingCalendar week={week} />
          ) : (
            <div className="rounded-3xl border border-dashed border-brand-surface-muted bg-white px-6 py-16 text-center shadow-sm shadow-brand-primary/5">
              <p className="text-base font-semibold text-brand-primary">
                Nessun orario disponibile al momento
              </p>
              <p className="mt-2 text-sm text-brand-muted">
                Non ci sono ancora finestre di apertura prenotabili. Riprova più
                tardi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
