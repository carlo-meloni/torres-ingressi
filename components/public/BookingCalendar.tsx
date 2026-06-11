"use client";

import { useMemo, useState } from "react";
import type { CalendarDay, CalendarSlot } from "@/types/booking";
import { SLOT_STATUS_META } from "@/lib/slot-status";
import SlotPicker from "./SlotPicker";
import BookingForm from "./BookingForm";

interface BookingCalendarProps {
  week: CalendarDay[];
}

/**
 * Calendario di prenotazione: stepper, striscia dei giorni, selettore degli
 * slot e form. Tiene lo stato della selezione (giorno → slot) e mostra il form
 * solo quando uno slot prenotabile è scelto.
 */
export default function BookingCalendar({ week }: BookingCalendarProps) {
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedDay = dayIndex !== null ? week[dayIndex] : null;
  const selectedSlot = useMemo<CalendarSlot | null>(
    () => selectedDay?.slots.find((s) => s.id === selectedSlotId) ?? null,
    [selectedDay, selectedSlotId]
  );

  const currentStep = selectedSlot ? 2 : selectedDay ? 1 : 0;
  const openSlots =
    selectedDay?.slots.filter((s) => SLOT_STATUS_META[s.status].selectable)
      .length ?? 0;

  function selectDay(index: number) {
    setDayIndex(index);
    setSelectedSlotId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Avanzamento ──────────────────────────────────────────────── */}
      <nav aria-label="Avanzamento prenotazione" className="px-1">
        <Stepper current={currentStep} />
      </nav>

      {/* ── Pannello calendario ──────────────────────────────────────── */}
      <div className="rounded-3xl border border-brand-surface-muted bg-white p-5 shadow-sm shadow-brand-primary/5 sm:p-7">
        {/* Striscia giorni */}
        <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
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
                  "group flex min-w-[4.75rem] snap-start flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-200 ease-out-soft active:scale-[0.97]",
                  isActive
                    ? "border-transparent bg-linear-to-b from-brand-primary to-brand-primary-dark text-white shadow-lg shadow-brand-primary/25 ring-1 ring-brand-gold/40"
                    : "border-brand-surface-muted bg-white text-brand-primary hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md hover:shadow-brand-primary/10",
                ].join(" ")}
              >
                <span
                  className={`text-[0.7rem] font-semibold uppercase tracking-wide ${
                    isActive ? "text-white/70" : "text-brand-muted"
                  }`}
                >
                  {day.weekday}
                </span>
                <span className="text-2xl font-bold leading-none tabular-nums">
                  {day.dayNumber}
                </span>
                <span
                  className={`mt-0.5 size-2 rounded-full transition-shadow duration-200 ${meta.dot} ${
                    isActive ? "ring-2 ring-white/30" : ""
                  }`}
                  aria-hidden
                />
                <span className="sr-only">{meta.label}</span>
              </button>
            );
          })}
        </div>

        {selectedDay ? (
          <>
            <hr className="my-6 border-brand-surface-muted" />

            {/* Slot della giornata: la chiave fa ripartire l'animazione di
                ingresso a ogni cambio giorno. */}
            <section
              key={selectedDay.date}
              className="reveal flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-brand-primary sm:text-lg">
                  Orari di {selectedDay.weekday} {selectedDay.dayNumber}{" "}
                  {selectedDay.month}
                </h2>
                {openSlots > 0 && (
                  <span className="rounded-full bg-brand-surface px-2.5 py-1 text-xs font-medium tabular-nums text-brand-muted">
                    {openSlots}{" "}
                    {openSlots === 1 ? "fascia disponibile" : "fasce disponibili"}
                  </span>
                )}
              </div>
              <SlotPicker
                day={selectedDay}
                selectedSlotId={selectedSlotId}
                onSelect={(slot) => setSelectedSlotId(slot.id)}
              />
            </section>
          </>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-brand-surface-muted bg-brand-surface/60 px-5 py-6 text-center text-sm text-brand-muted">
            Seleziona un giorno per vedere gli orari disponibili.
          </p>
        )}
      </div>

      {/* ── Form (solo a slot selezionato) ───────────────────────────── */}
      {selectedSlot && selectedDay && (
        <section className="reveal rounded-3xl border border-brand-surface-muted bg-white p-6 shadow-sm shadow-brand-primary/5 sm:p-7">
          <h2 className="mb-5 text-base font-semibold text-brand-primary sm:text-lg">
            I tuoi dati
          </h2>
          <BookingForm day={selectedDay} slot={selectedSlot} />
        </section>
      )}
    </div>
  );
}

const STEPS = ["Giorno", "Orario", "Dati"] as const;

/**
 * Indicatore di avanzamento della prenotazione. `current` è l'indice dello
 * step attivo; gli step precedenti risultano completati.
 */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-3">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-2 last:flex-none sm:flex-1"
          >
            <span
              className={[
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ease-out-soft",
                active
                  ? "scale-110 bg-brand-accent text-white shadow-sm shadow-brand-accent/30"
                  : done
                    ? "bg-brand-primary text-white"
                    : "bg-brand-surface-muted text-brand-muted",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                active
                  ? "text-brand-primary"
                  : done
                    ? "text-brand-primary/70"
                    : "text-brand-muted"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-1 hidden h-px flex-1 transition-colors duration-300 sm:block ${
                  done ? "bg-brand-primary/40" : "bg-brand-surface-muted"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
