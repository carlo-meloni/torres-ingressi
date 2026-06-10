"use client";

import { useMemo, useState } from "react";

import { formatDate, formatTime } from "@/lib/format";
import {
  BOOKING_STATUS_META,
  BOOKING_STATUS_ORDER,
} from "@/lib/booking-status";
import type {
  BookingCounterOption,
  BookingListItem,
  BookingStatusValue,
} from "@/types/booking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

/**
 * Tabella prenotazioni (vista admin, sola lettura): elenca tutte le
 * prenotazioni ordinate per orario, con filtri per data, sportello e stato.
 * Il filtro è interamente lato client sui dati caricati dal server component.
 */
export function BookingsTable({
  initialBookings,
  counterOptions,
}: {
  initialBookings: BookingListItem[];
  counterOptions: BookingCounterOption[];
}) {
  const [counterFilter, setCounterFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [dateFilter, setDateFilter] = useState(ALL);

  // Giorni distinti presenti tra le prenotazioni (per il filtro data).
  const dateOptions = useMemo(() => {
    const labels = new Set(
      initialBookings.map((b) => formatDate(b.slotStart)),
    );
    return Array.from(labels);
  }, [initialBookings]);

  const filtered = useMemo(
    () =>
      initialBookings.filter((b) => {
        if (counterFilter !== ALL && b.counterId !== counterFilter) {
          return false;
        }
        if (statusFilter !== ALL && b.status !== statusFilter) return false;
        if (dateFilter !== ALL && formatDate(b.slotStart) !== dateFilter) {
          return false;
        }
        return true;
      }),
    [initialBookings, counterFilter, statusFilter, dateFilter],
  );

  const hasBookings = initialBookings.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-brand-primary">Prenotazioni</h1>
        <p className="text-sm text-brand-muted">
          Elenco delle prenotazioni dei tifosi —{" "}
          {hasBookings
            ? `${filtered.length} di ${initialBookings.length}`
            : "nessuna prenotazione"}
          .
        </p>
      </header>

      {hasBookings && (
        <div className="flex flex-wrap items-end gap-4">
          <FilterSelect
            label="Data"
            value={dateFilter}
            onValueChange={setDateFilter}
            allLabel="Tutte le date"
            options={dateOptions.map((d) => ({ value: d, label: d }))}
          />
          <FilterSelect
            label="Servito da"
            value={counterFilter}
            onValueChange={setCounterFilter}
            allLabel="Tutti gli sportelli"
            options={counterOptions.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            label="Stato"
            value={statusFilter}
            onValueChange={setStatusFilter}
            allLabel="Tutti gli stati"
            options={BOOKING_STATUS_ORDER.map((s) => ({
              value: s,
              label: BOOKING_STATUS_META[s].label,
            }))}
          />
        </div>
      )}

      {!hasBookings ? (
        <EmptyState message="Nessuna prenotazione. Le prenotazioni dei tifosi compariranno qui." />
      ) : filtered.length === 0 ? (
        <EmptyState message="Nessuna prenotazione corrisponde ai filtri selezionati." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-surface-muted bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3">Tifoso</th>
                <th className="px-4 py-3">Servito da</th>
                <th className="px-4 py-3">Orario slot</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Singola riga prenotazione. */
function BookingRow({ booking }: { booking: BookingListItem }) {
  const start = new Date(booking.slotStart);
  const end = new Date(booking.slotEnd);

  return (
    <tr className="border-b border-brand-surface-muted last:border-b-0 transition-colors hover:bg-brand-surface/60">
      <td className="px-4 py-3 font-semibold tabular-nums text-brand-primary">
        #{booking.ticketNumber}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-brand-primary">{booking.name}</span>
          {(booking.email || booking.phone) && (
            <span className="text-xs text-brand-muted">
              {[booking.email, booking.phone].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-brand-muted">
        {booking.counterName ?? "—"}
      </td>
      <td className="px-4 py-3 text-brand-muted">
        <span className="text-brand-primary">{formatDate(start)}</span>{" "}
        {formatTime(start)}–{formatTime(end)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={booking.status} />
      </td>
    </tr>
  );
}

/** Badge dello stato di una prenotazione. */
function StatusBadge({ status }: { status: BookingStatusValue }) {
  const meta = BOOKING_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

/** Select di filtro con etichetta e opzione "tutti". */
function FilterSelect({
  label,
  value,
  onValueChange,
  allLabel,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-w-44 flex-col gap-1.5">
      <span className="text-xs font-semibold text-brand-muted">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Stato vuoto (nessuna prenotazione o nessun risultato dai filtri). */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-20 text-center">
      <p className="text-sm font-medium text-brand-muted">{message}</p>
    </div>
  );
}
