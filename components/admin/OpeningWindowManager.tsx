"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createOpeningWindow,
  deleteOpeningWindow,
} from "@/actions/opening-windows";
import {
  openingWindowFormSchema,
  type OpeningWindowFormValues,
} from "@/lib/schemas/opening-window";
import { formatDate, formatTime } from "@/lib/format";
import { generateSlotRanges } from "@/lib/slots";
import type {
  CounterOption,
  OpeningWindowInput,
  OpeningWindowListItem,
} from "@/types/opening-window";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Toast = { id: number; kind: "success" | "error"; message: string };

/**
 * Gestione aperture (finestre): apri e chiudi le finestre orarie degli
 * sportelli. Mantiene la lista come stato locale — aggiornato dopo ogni Server
 * Action andata a buon fine — per un feedback immediato; le `revalidatePath`
 * lato server riallineano le altre viste.
 */
export function OpeningWindowManager({
  initialWindows,
  counterOptions,
}: {
  initialWindows: OpeningWindowListItem[];
  counterOptions: CounterOption[];
}) {
  const [windows, setWindows] = useState(initialWindows);
  const [creating, setCreating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function notify(kind: Toast["kind"], message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  const noCounters = counterOptions.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-brand-primary">Aperture</h1>
          <p className="text-sm text-brand-muted">
            Apri e chiudi le finestre orarie degli sportelli — {windows.length}{" "}
            {windows.length === 1 ? "finestra" : "finestre"}.
          </p>
        </div>
        {!creating && !noCounters && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-accent/35 active:translate-y-0"
          >
            + Apri finestra
          </button>
        )}
      </header>

      {noCounters && (
        <div className="rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-brand-muted">
            Nessuno sportello attivo. Crea o attiva uno sportello in{" "}
            <span className="font-semibold text-brand-primary">Sportelli</span>{" "}
            prima di aprire una finestra.
          </p>
        </div>
      )}

      {creating && (
        <OpeningWindowForm
          counterOptions={counterOptions}
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            const result = await createOpeningWindow(values);
            if (result.success) {
              const counterName =
                counterOptions.find((c) => c.id === values.counterId)?.name ??
                "—";
              setWindows((prev) =>
                [
                  {
                    id: result.data.id,
                    counterId: values.counterId,
                    counterName,
                    startTime: new Date(values.startTime).toISOString(),
                    endTime: new Date(values.endTime).toISOString(),
                    slotDuration: values.slotDuration,
                    capacity: values.capacity,
                    slotCount: result.data.slotCount,
                    bookingCount: 0,
                  },
                  ...prev,
                ].sort((a, b) => b.startTime.localeCompare(a.startTime)),
              );
              setCreating(false);
              notify(
                "success",
                `Finestra aperta — ${result.data.slotCount} slot generati.`,
              );
            } else {
              notify("error", result.error);
            }
            return result.success;
          }}
        />
      )}

      {windows.length === 0 && !creating ? (
        !noCounters && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-20 text-center">
            <p className="text-sm font-medium text-brand-muted">
              Nessuna finestra aperta. Apri una finestra per generare gli slot
              prenotabili.
            </p>
          </div>
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {windows.map((window) => (
            <OpeningWindowRow
              key={window.id}
              window={window}
              onDelete={async () => {
                const result = await deleteOpeningWindow(window.id);
                if (result.success) {
                  setWindows((prev) => prev.filter((w) => w.id !== window.id));
                  notify("success", "Finestra chiusa.");
                } else {
                  notify("error", result.error);
                }
              }}
            />
          ))}
        </ul>
      )}

      <ToastViewport toasts={toasts} />
    </div>
  );
}

/** Riga di una finestra con orari, parametri e conteggi. */
function OpeningWindowRow({
  window,
  onDelete,
}: {
  window: OpeningWindowListItem;
  onDelete: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const start = new Date(window.startTime);
  const end = new Date(window.endTime);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-surface-muted bg-white px-5 py-4 transition-shadow hover:shadow-sm">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-semibold text-brand-primary">
            {window.counterName}
          </span>
          <span className="text-sm text-brand-muted">
            {formatDate(start)} · {formatTime(start)}–{formatTime(end)}
          </span>
        </div>
        <p className="text-xs text-brand-muted">
          {window.slotDuration} min/slot · capacità {window.capacity} ·{" "}
          {window.slotCount} slot
          {window.bookingCount > 0 &&
            ` · ${window.bookingCount} prenotazion${
              window.bookingCount === 1 ? "e" : "i"
            }`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {confirmingDelete ? (
          <>
            <span className="text-sm text-brand-muted">Chiudere?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(onDelete)}
              className="rounded-md bg-status-full px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
            >
              Sì, chiudi
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
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-status-full transition-colors hover:bg-status-full/5 disabled:opacity-60"
          >
            Chiudi
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Form di apertura di una finestra: react-hook-form + `zodResolver` (schema
 * condiviso con la Server Action) + primitive shadcn/ui.
 */
function OpeningWindowForm({
  counterOptions,
  onSubmit,
  onCancel,
}: {
  counterOptions: CounterOption[];
  /** Ritorna `true` se l'azione è andata a buon fine (per chiudere il form). */
  onSubmit: (values: OpeningWindowInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const form = useForm<OpeningWindowFormValues>({
    resolver: zodResolver(openingWindowFormSchema),
    defaultValues: {
      counterId: counterOptions[0]?.id ?? "",
      startTime: "",
      endTime: "",
      slotDuration: 10,
      capacity: 1,
    },
  });

  const [startTime, endTime, slotDuration] = useWatch({
    control: form.control,
    name: ["startTime", "endTime", "slotDuration"],
  });

  // Anteprima del numero di slot generati (riusa la logica pura del backend).
  const slotPreview = (() => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    return generateSlotRanges({
      windowStart: start,
      windowEnd: end,
      slotDurationMinutes: slotDuration,
    }).length;
  })();

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
        noValidate
        className="flex flex-col gap-4 rounded-2xl border border-brand-accent/20 bg-white p-5 shadow-sm"
      >
        <FormField
          control={form.control}
          name="counterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Sportello <span className="text-brand-accent">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={submitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona uno sportello" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {counterOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Inizio <span className="text-brand-accent">*</span>
                </FormLabel>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={submitting}
                  aria-invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Fine <span className="text-brand-accent">*</span>
                </FormLabel>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={submitting}
                  aria-invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="slotDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durata slot (minuti)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacità per slot</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {slotPreview !== null && (
          <FormDescription>
            {slotPreview > 0
              ? `Verranno generati ${slotPreview} slot.`
              : "L'intervallo è troppo breve per generare anche un solo slot."}
          </FormDescription>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" variant="brand" disabled={submitting}>
            {submitting ? "Apertura…" : "Apri finestra"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
            className="text-brand-muted"
          >
            Annulla
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Toast effimeri per le azioni admin (in basso a destra). */
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
