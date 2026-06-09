"use client";

import { useMemo, useState } from "react";
import type { CalendarDay, CalendarSlot } from "@/types/booking";
import { SLOT_STATUS_META } from "@/lib/slot-status";
import SlotPicker from "./SlotPicker";
import BookingForm from "./BookingForm";

interface BookingCalendarProps {
  week: CalendarDay[];
}

/** Indice del primo giorno con almeno uno slot prenotabile. */
function firstOpenIndex(week: CalendarDay[]): number {
  const i = week.findIndex(
    (d) => d.status === "aperto" || d.status === "quasi_pieno"
  );
  return i === -1 ? 0 : i;
}

/**
 * Calendario di prenotazione: striscia dei giorni, selettore degli slot e
 * form. Tiene lo stato della selezione (giorno → slot) e mostra il form solo
 * quando uno slot prenotabile è scelto.
 */
export default function BookingCalendar({ week }: BookingCalendarProps) {
  const [dayIndex, setDayIndex] = useState(() => firstOpenIndex(week));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedDay = week[dayIndex];
  const selectedSlot = useMemo<CalendarSlot | null>(
    () => selectedDay.slots.find((s) => s.id === selectedSlotId) ?? null,
    [selectedDay, selectedSlotId]
  );

  function selectDay(index: number) {
    setDayIndex(index);
    setSelectedSlotId(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Striscia giorni ──────────────────────────────────────────── */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {week.map((day, i) => {
          const meta = SLOT_STATUS_META[day.status];
          const isActive = i === dayIndex;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => selectDay(i)}
              aria-pressed={isActive}
              className={[
                "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition-all duration-200",
                isActive
                  ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "border-brand-surface-muted bg-white text-brand-primary hover:-translate-y-0.5 hover:border-brand-primary/40",
              ].join(" ")}
            >
              <span
                className={`text-xs font-medium uppercase tracking-wide ${
                  isActive ? "text-white/70" : "text-brand-muted"
                }`}
              >
                {day.weekday}
              </span>
              <span className="text-xl font-bold leading-none">
                {day.dayNumber}
              </span>
              <span
                className={`mt-0.5 size-2 rounded-full ${meta.dot}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {/* ── Slot della giornata ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-brand-primary">
          Slot di {selectedDay.weekday} {selectedDay.dayNumber}{" "}
          {selectedDay.month}
        </h2>
        <SlotPicker
          day={selectedDay}
          selectedSlotId={selectedSlotId}
          onSelect={(slot) => setSelectedSlotId(slot.id)}
        />
      </section>

      {/* ── Form (solo a slot selezionato) ───────────────────────────── */}
      {selectedSlot && (
        <section className="rounded-2xl border border-brand-surface-muted bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-brand-primary">
            I tuoi dati
          </h2>
          <BookingForm day={selectedDay} slot={selectedSlot} />
        </section>
      )}
    </div>
  );
}
