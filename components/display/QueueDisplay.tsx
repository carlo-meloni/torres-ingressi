"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { QueueSnapshot } from "@/types/booking";
import { formatTicket } from "@/lib/format";
import { APP_TIME_ZONE } from "@/lib/timezone";
import { useQueueChannel } from "@/lib/use-queue-channel";
import { useCallChime } from "@/lib/use-call-chime";
import logo from "@/public/logo.webp";

interface QueueDisplayProps {
  initial: QueueSnapshot;
}

/**
 * Schermo pubblico della coda: dark mode, alto contrasto e numeri giganti in
 * stile tabellone (caratteri monospazio) per la lettura da lontano su un
 * monitor sempre acceso. Copre l'intera viewport (sopra il chrome pubblico)
 * ed è pensato per restare aperto a tutto schermo.
 *
 * Parte dall'istantanea iniziale letta dal server e si aggiorna in tempo reale
 * via Pusher (evento `queue-updated`): ogni chiamata del bigliettaio rimonta il
 * numero hero e fa ripartire l'animazione.
 */
export default function QueueDisplay({ initial }: QueueDisplayProps) {
  const queue = useQueueChannel(initial);

  const latestCounter =
    queue.counters.find((c) => c.id === queue.latestCounterId) ??
    queue.counters[0] ??
    null;
  const latestTicket = latestCounter ? queue.serving[latestCounter.id] : null;

  // Campanello a ogni nuovo numero chiamato (sportello + ticket identificano la chiamata).
  const callKey =
    latestCounter && latestTicket != null
      ? `${latestCounter.id}:${latestTicket}`
      : null;
  const { ready: soundReady, enableSound } = useCallChime(callKey);

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-brand-primary-dark text-white">
      {/* ── Sfondo: bagliori ambientali + filigrana stemma ───────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 size-[42rem] rounded-full bg-brand-accent/15 blur-[150px]" />
        <div className="absolute -bottom-48 -left-40 size-[42rem] rounded-full bg-brand-primary-light/25 blur-[160px]" />
        <div className="animate-ambient absolute left-1/2 top-1/2 size-[55rem] rounded-full bg-brand-primary-light/15 blur-[170px]" />
        <Image
          src={logo}
          alt=""
          width={620}
          height={760}
          aria-hidden
          className="absolute left-1/2 top-1/2 w-[34rem] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.045] sm:w-[42rem]"
        />
      </div>

      <div className="relative flex h-full flex-col">
        {/* ── Barra superiore ────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-8 py-6 sm:px-12 sm:py-8">
          <Link
            href="/"
            className="group flex items-center gap-4 transition-opacity hover:opacity-90"
          >
            <Image
              src={logo}
              alt="Stemma Torres Sassari"
              width={48}
              height={59}
              priority
              className="h-12 w-auto drop-shadow-md transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:scale-105 sm:h-14"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-white sm:text-lg">
                Torres Sassari
              </span>
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-white/60 sm:text-xs">
                Biglietteria
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-6 sm:gap-9">
            {!soundReady && (
              <button
                type="button"
                onClick={enableSound}
                className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-white/40 hover:text-white"
              >
                <span aria-hidden>🔔</span>
                Attiva audio
              </button>
            )}
            <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-open opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-status-open" />
              </span>
              In diretta
            </span>
            <Clock />
          </div>
        </header>

        {/* ── Hero: numero chiamato ──────────────────────────────────── */}
        <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="pl-[0.5em] text-sm font-medium uppercase tracking-[0.5em] text-white/60 sm:text-base">
            Turno
          </p>

          <div className="relative isolate my-2 sm:my-3">
            {/* Riflettore caldo dietro il numero. */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 size-[1.4em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/25 blur-[100px]"
            />
            {/* La key sul ticket rimonta il blocco e fa ripartire l'animazione. */}
            <p
              key={latestTicket}
              className="animate-call-pop bg-linear-to-b from-white via-white to-white/65 bg-clip-text font-mono text-[40vw] font-semibold leading-[0.82] tracking-tighter tabular-nums text-transparent sm:text-[30vw] lg:text-[23rem]"
            >
              {latestTicket != null ? formatTicket(latestTicket) : "—"}
            </p>
          </div>

          {latestCounter && latestTicket != null && (
            <div className="mt-3 inline-flex items-center gap-2.5 rounded-full bg-brand-accent px-7 py-2.5 shadow-lg shadow-brand-accent/30 sm:px-9 sm:py-3">
              <span className="size-2 rounded-full bg-white/85" aria-hidden />
              <span className="text-lg font-semibold uppercase tracking-[0.15em] text-white sm:text-2xl">
                {latestCounter.name}
              </span>
            </div>
          )}

          {/* Annuncio accessibile del numero chiamato. */}
          <p aria-live="polite" className="sr-only">
            {latestTicket != null && latestCounter
              ? `Turno ${formatTicket(latestTicket)}, ${latestCounter.name}`
              : ""}
          </p>
        </main>

        {/* ── Sportelli aperti ───────────────────────────────────────── */}
        <section className="px-6 pb-3 sm:px-12">
          <ul className="mx-auto flex max-w-6xl flex-wrap items-stretch justify-center gap-3 sm:gap-4">
            {queue.counters.map((counter) => {
              const ticket = queue.serving[counter.id];
              const isLatest = counter.id === latestCounter?.id;
              return (
                <li
                  key={counter.id}
                  className={[
                    "flex min-w-[10rem] flex-1 flex-col items-center gap-1.5 rounded-2xl border px-6 py-4 backdrop-blur-sm transition-all duration-500 ease-[var(--ease-out-soft)]",
                    isLatest
                      ? "-translate-y-1 border-brand-gold/55 bg-white/10 shadow-xl shadow-brand-primary-dark/50 ring-1 ring-brand-gold/40"
                      : "border-white/10 bg-white/[0.04]",
                  ].join(" ")}
                >
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/60 sm:text-sm">
                    {counter.name}
                  </span>
                  <span
                    key={ticket}
                    className="animate-tick-in font-mono text-4xl font-semibold tabular-nums text-white sm:text-5xl"
                  >
                    {ticket != null ? formatTicket(ticket) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Prossimi in coda ───────────────────────────────────────── */}
        <footer className="border-t border-white/10 bg-brand-primary-dark/70 px-6 py-6 backdrop-blur-sm sm:px-12">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55 sm:text-sm">
              Prossimi
            </span>
            <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {queue.upcoming.slice(0, 5).map((n, i) => (
                <li
                  key={n}
                  className={[
                    "rounded-xl px-4 py-2 font-mono text-xl font-semibold tabular-nums transition-colors duration-300 sm:px-5 sm:text-2xl",
                    i === 0
                      ? "bg-white/10 text-white ring-1 ring-brand-gold/40"
                      : "bg-white/[0.06] text-white/70",
                  ].join(" ")}
                >
                  {formatTicket(n)}
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Orologio in tempo reale. Renderizza un segnaposto fino al mount per evitare
 * mismatch di hydration (l'ora del server differisce da quella del client).
 */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    // setTimeout(0) evita una setState sincrona nel corpo dell'effect
    // (lint) ma aggiorna l'ora di fatto subito dopo il mount.
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <span className="text-right tabular-nums">
      <span className="block font-mono text-xl font-semibold leading-none sm:text-2xl">
        {now
          ? new Intl.DateTimeFormat("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: APP_TIME_ZONE,
            }).format(now)
          : "--:--"}
      </span>
      <span className="mt-1 block text-xs capitalize text-white/60">
        {now
          ? new Intl.DateTimeFormat("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: APP_TIME_ZONE,
            }).format(now)
          : ""}
      </span>
    </span>
  );
}
