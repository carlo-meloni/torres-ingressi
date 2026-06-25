import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

// Pagina con dati personali, una per prenotazione: fuori dall'indice.
export const metadata: Metadata = {
  title: "Prenotazione confermata",
  robots: { index: false, follow: false },
};

interface ConfermaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Estrae un singolo valore stringa dai search params. */
function param(
  values: Record<string, string | string[] | undefined>,
  key: string
): string {
  const value = values[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Due cifre con zero iniziale. */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formatta una data in italiano esteso (fuso del server). */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/**
 * Conferma della prenotazione con il numero di turno bene in vista. Riceve solo
 * l'id della prenotazione (`?b=`) e ne rilegge i dettagli dal DB: nessun dato
 * personale transita nella URL.
 */
export default async function ConfermaPage({
  searchParams,
}: ConfermaPageProps) {
  const sp = await searchParams;
  const id = param(sp, "b");

  const booking = id
    ? await prisma.booking.findUnique({
        where: { id },
        select: {
          ticketNumber: true,
          name: true,
          email: true,
          slot: { select: { startTime: true } },
        },
      })
    : null;

  // Senza una prenotazione valida non c'è nulla da confermare.
  if (!booking) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-primary">
          Nessuna prenotazione da mostrare
        </h1>
        <p className="text-brand-muted">
          Sembra che tu sia arrivato qui senza completare una prenotazione.
        </p>
        <Link
          href="/prenota"
          className="rounded-full bg-brand-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-accent-hover"
        >
          Vai al calendario
        </Link>
      </div>
    );
  }

  const { ticketNumber, name, email } = booking;
  const start = booking.slot.startTime;
  const dayLabel = formatDate(start);
  const time = `${pad(start.getHours())}:${pad(start.getMinutes())}`;

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-12 sm:py-16">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Esito */}
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-14 place-items-center rounded-full bg-status-open/15 text-status-open">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h1 className="text-3xl font-bold text-brand-primary sm:text-4xl">
            Prenotazione confermata
          </h1>
          {name && (
            <p className="text-brand-muted">
              A presto, <span className="font-semibold">{name}</span>!
            </p>
          )}
        </div>

        {/* Numero di turno */}
        <div className="w-full overflow-hidden rounded-3xl bg-linear-to-br from-brand-primary to-brand-primary-light px-6 py-10 text-white">
          <span className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
            Il tuo turno
          </span>
          <p className="mt-2 text-7xl font-bold tabular-nums tracking-tight sm:text-8xl">
            {String(ticketNumber).padStart(3, "0")}
          </p>
        </div>

        {/* Dettagli */}
        <dl className="w-full divide-y divide-brand-surface-muted rounded-2xl border border-brand-surface-muted bg-white text-left text-sm">
          <Detail label="Giorno" value={dayLabel} />
          <Detail label="Orario" value={time} />
          {email && <Detail label="Conferma inviata a" value={email} />}
        </dl>

        <p className="text-sm text-brand-muted">
          Presentati all&apos;orario indicato e attendi che il tuo numero venga
          chiamato sullo schermo. Puoi seguire la coda dallo{" "}
          <Link
            href="/display"
            className="font-medium text-brand-accent underline-offset-2 hover:underline"
          >
            schermo pubblico
          </Link>
          .
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/prenota"
            className="rounded-full border border-brand-surface-muted px-6 py-3 font-semibold text-brand-primary transition-colors hover:border-brand-primary/40"
          >
            Nuova prenotazione
          </Link>
          <Link
            href="/"
            className="rounded-full bg-brand-accent px-6 py-3 font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-accent-hover"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Riga di dettaglio della prenotazione. */
function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <dt className="text-brand-muted">{label}</dt>
      <dd className="font-semibold text-brand-primary">{value}</dd>
    </div>
  );
}
