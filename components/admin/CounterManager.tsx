"use client";

import { useState, useTransition } from "react";

import {
  createCounter,
  deleteCounter,
  toggleCounterActive,
  updateCounter,
} from "@/actions/counters";
import type { CounterInput, CounterListItem } from "@/types/counter";

type Toast = { id: number; kind: "success" | "error"; message: string };

/**
 * Gestione sportelli (CRUD) lato admin. Mantiene la lista come stato locale —
 * aggiornato dopo ogni Server Action andata a buon fine — per un feedback
 * immediato; le `revalidatePath` lato server riallineano le altre viste.
 */
export function CounterManager({
  initialCounters,
}: {
  initialCounters: CounterListItem[];
}) {
  const [counters, setCounters] = useState(initialCounters);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function notify(kind: Toast["kind"], message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  const activeCount = counters.filter((c) => c.isActive).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-brand-primary">Sportelli</h1>
          <p className="text-sm text-brand-muted">
            Gestisci gli sportelli della biglietteria — {counters.length}{" "}
            totali, {activeCount} attivi.
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-accent/35 active:translate-y-0"
          >
            + Nuovo sportello
          </button>
        )}
      </header>

      {creating && (
        <CounterForm
          submitLabel="Crea sportello"
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            const result = await createCounter(values);
            if (result.success) {
              setCounters((prev) => [
                {
                  id: result.data.id,
                  name: values.name.trim(),
                  description: values.description?.trim() || null,
                  isActive: values.isActive ?? true,
                  openingWindowCount: 0,
                },
                ...prev,
              ]);
              setCreating(false);
              notify("success", "Sportello creato.");
            } else {
              notify("error", result.error);
            }
            return result.success;
          }}
        />
      )}

      {counters.length === 0 && !creating ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-20 text-center">
          <p className="text-sm font-medium text-brand-muted">
            Nessuno sportello. Creane uno per iniziare ad aprire le finestre.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {counters.map((counter) =>
            editingId === counter.id ? (
              <li key={counter.id}>
                <CounterForm
                  submitLabel="Salva modifiche"
                  initial={counter}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    const result = await updateCounter(counter.id, values);
                    if (result.success) {
                      setCounters((prev) =>
                        prev.map((c) =>
                          c.id === counter.id
                            ? {
                                ...c,
                                name: values.name.trim(),
                                description: values.description?.trim() || null,
                                isActive: values.isActive ?? c.isActive,
                              }
                            : c,
                        ),
                      );
                      setEditingId(null);
                      notify("success", "Sportello aggiornato.");
                    } else {
                      notify("error", result.error);
                    }
                    return result.success;
                  }}
                />
              </li>
            ) : (
              <CounterRow
                key={counter.id}
                counter={counter}
                onEdit={() => setEditingId(counter.id)}
                onToggle={async () => {
                  const next = !counter.isActive;
                  const result = await toggleCounterActive(counter.id, next);
                  if (result.success) {
                    setCounters((prev) =>
                      prev.map((c) =>
                        c.id === counter.id
                          ? { ...c, isActive: result.data.isActive }
                          : c,
                      ),
                    );
                    notify(
                      "success",
                      next ? "Sportello attivato." : "Sportello disattivato.",
                    );
                  } else {
                    notify("error", result.error);
                  }
                }}
                onDelete={async () => {
                  const result = await deleteCounter(counter.id);
                  if (result.success) {
                    setCounters((prev) =>
                      prev.filter((c) => c.id !== counter.id),
                    );
                    notify("success", "Sportello eliminato.");
                  } else {
                    notify("error", result.error);
                  }
                }}
              />
            ),
          )}
        </ul>
      )}

      <ToastViewport toasts={toasts} />
    </div>
  );
}

/** Riga di uno sportello con badge di stato e azioni. */
function CounterRow({
  counter,
  onEdit,
  onToggle,
  onDelete,
}: {
  counter: CounterListItem;
  onEdit: () => void;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-surface-muted bg-white px-5 py-4 transition-shadow hover:shadow-sm">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-brand-primary">
            {counter.name}
          </span>
          <StatusBadge isActive={counter.isActive} />
        </div>
        {counter.description && (
          <p className="truncate text-sm text-brand-muted">
            {counter.description}
          </p>
        )}
        <p className="text-xs text-brand-muted">
          {counter.openingWindowCount === 0
            ? "Nessuna apertura"
            : `${counter.openingWindowCount} apertur${counter.openingWindowCount === 1 ? "a" : "e"}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {confirmingDelete ? (
          <>
            <span className="text-sm text-brand-muted">Eliminare?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(onDelete)}
              className="rounded-md bg-status-full px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
            >
              Sì, elimina
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-surface disabled:opacity-60"
            >
              Annulla
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(onToggle)}
              className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-surface disabled:opacity-60"
            >
              {counter.isActive ? "Disattiva" : "Attiva"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onEdit}
              className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-surface disabled:opacity-60"
            >
              Modifica
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-status-full transition-colors hover:bg-status-full/5 disabled:opacity-60"
            >
              Elimina
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/** Form condiviso per creazione e modifica di uno sportello. */
function CounterForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: CounterListItem;
  submitLabel: string;
  /** Ritorna `true` se l'azione è andata a buon fine (per chiudere il form). */
  onSubmit: (values: CounterInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Il nome deve avere almeno 2 caratteri.");
      return;
    }
    setError(null);
    startTransition(async () => {
      await onSubmit({ name, description, isActive });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl border border-brand-accent/20 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Nome <span className="text-brand-accent">*</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoFocus
            placeholder="Sportello 1"
            className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Descrizione{" "}
            <span className="font-normal text-brand-muted">— opzionale</span>
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            type="text"
            placeholder="Abbonamenti e accrediti"
            className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
        </label>
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium text-brand-primary">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 rounded border-brand-surface-muted text-brand-accent focus:ring-brand-accent/30"
        />
        Sportello attivo (abilitato alle aperture)
      </label>

      {error && <p className="text-xs text-status-full">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-surface disabled:opacity-60"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-status-open/10 px-2.5 py-0.5 text-xs font-semibold text-status-open"
          : "inline-flex items-center gap-1.5 rounded-full bg-brand-surface-muted px-2.5 py-0.5 text-xs font-semibold text-brand-muted"
      }
    >
      <span
        className={`size-1.5 rounded-full ${isActive ? "bg-status-open" : "bg-brand-muted"}`}
        aria-hidden
      />
      {isActive ? "Attivo" : "Inattivo"}
    </span>
  );
}

/** Toast effimeri per le azioni admin (in alto a destra). */
function ToastViewport({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={
            toast.kind === "success"
              ? "rounded-xl border border-status-open/20 bg-white px-4 py-3 text-sm font-medium text-brand-primary shadow-lg shadow-black/5"
              : "rounded-xl border border-status-full/20 bg-white px-4 py-3 text-sm font-medium text-status-full shadow-lg shadow-black/5"
          }
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
