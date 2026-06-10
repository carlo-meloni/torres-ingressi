"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { markServed, markSkipped } from "@/actions/queue";
import { CallNextButton } from "@/components/cassa/CallNextButton";
import { Button } from "@/components/ui/button";
import { BOOKING_STATUS_META } from "@/lib/booking-status";
import { formatTicket } from "@/lib/format";
import { useQueueChannel } from "@/lib/use-queue-channel";
import type {
  CassaQueueData,
  CounterQueue,
  QueueSnapshot,
} from "@/types/booking";

/** Snapshot vuoto: la cassa usa il canale solo come "ping", non ne legge i dati. */
const EMPTY_SNAPSHOT: QueueSnapshot = {
  counters: [],
  serving: {},
  latestCounterId: null,
  upcoming: [],
};

/**
 * Dashboard del bigliettaio. Renderizza una card per sportello aperto oggi con il
 * turno in chiamata e i prossimi in coda. Le azioni (chiama prossimo / servita /
 * salta) sono Server Actions; i dati arrivano dal server component e si aggiornano
 * via `router.refresh()` a ogni evento realtime della coda.
 */
export function QueuePanel({ initial }: { initial: CassaQueueData }) {
  const router = useRouter();

  // Pusher come "ping": a ogni evento ricarichiamo i dati server (props fresche).
  useQueueChannel(EMPTY_SNAPSHOT, { onPing: () => router.refresh() });

  const { counters, servedToday } = initial;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-brand-primary">Coda</h1>
          <p className="text-sm text-brand-muted">
            Gestione dei turni della biglietteria — in tempo reale.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-status-open/30 bg-status-open/10 px-3 py-1 text-sm font-medium text-status-open">
          <span className="size-1.5 rounded-full bg-status-open" aria-hidden />
          {servedToday} {servedToday === 1 ? "servito" : "serviti"} oggi
        </span>
      </header>

      {counters.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-20 text-center">
          <p className="text-sm font-medium text-brand-muted">
            Nessuno sportello aperto oggi. Apri una finestra dalla sezione
            Aperture per iniziare a gestire la coda.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {counters.map((counter) => (
            <CounterCard key={counter.counterId} counter={counter} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Card di un singolo sportello: turno in chiamata, azioni e prossimi in coda. */
function CounterCard({ counter }: { counter: CounterQueue }) {
  const { counterId, counterName, current, waiting } = counter;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resolve(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    if (!current) return;
    setError(null);
    const id = current.id;
    startTransition(async () => {
      const result = await action(id);
      if (!result.success) setError(result.error ?? "Operazione non riuscita.");
    });
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-brand-surface-muted bg-white p-5 shadow-sm">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
          {counterName}
        </h2>
        <span className="text-xs text-brand-muted">
          {waiting.length} in attesa
        </span>
      </header>

      {/* Turno in chiamata. */}
      <div className="rounded-xl border border-brand-surface-muted bg-brand-surface/50 px-4 py-5 text-center">
        {current ? (
          <div className="flex flex-col items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${BOOKING_STATUS_META.CHIAMATA.badge}`}
            >
              {BOOKING_STATUS_META.CHIAMATA.label}
            </span>
            <span className="font-mono text-5xl font-bold tabular-nums text-brand-primary">
              {formatTicket(current.ticketNumber)}
            </span>
            <span className="text-sm font-medium text-brand-primary">
              {current.name}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <span className="font-mono text-5xl font-bold tabular-nums text-brand-muted/40">
              —
            </span>
            <span className="text-sm text-brand-muted">Nessun turno in chiamata</span>
          </div>
        )}
      </div>

      {/* Azioni sul turno corrente. */}
      {current && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => resolve(markServed)}
          >
            Servita
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => resolve(markSkipped)}
            className="text-status-full hover:text-status-full"
          >
            Salta
          </Button>
        </div>
      )}

      <CallNextButton
        counterId={counterId}
        disabled={isPending}
        onError={setError}
      />

      {error && (
        <p className="text-sm font-medium text-status-full" role="alert">
          {error}
        </p>
      )}

      {/* Prossimi in coda. */}
      {waiting.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-brand-surface-muted pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Prossimi
          </span>
          <ul className="flex flex-col gap-1.5">
            {waiting.slice(0, 5).map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 text-sm text-brand-primary"
              >
                <span className="font-mono font-semibold tabular-nums text-brand-muted">
                  {formatTicket(b.ticketNumber)}
                </span>
                <span className="truncate">{b.name}</span>
              </li>
            ))}
            {waiting.length > 5 && (
              <li className="text-xs text-brand-muted">
                + altri {waiting.length - 5}
              </li>
            )}
          </ul>
        </div>
      )}
    </article>
  );
}
