"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BookingFormData,
  CalendarDay,
  CalendarSlot,
} from "@/types/booking";
import { SLOT_STATUS_META } from "@/lib/slot-status";
import { createBooking } from "@/actions/bookings";
import SlotPicker from "./SlotPicker";
import {
  BookingDataFields,
  validateBookingData,
  type BookingFieldErrors,
} from "./BookingForm";

interface BookingCalendarProps {
  week: CalendarDay[];
}

/** Step del wizard di prenotazione. */
const STEPS = ["Orario", "Dati", "Conferma"] as const;
type Step = 0 | 1 | 2;

const EMPTY_FORM: BookingFormData = { name: "", email: "", phone: "" };

/**
 * Wizard di prenotazione: una vista per volta. L'utente sceglie giorno e fascia
 * oraria (step "Orario"), inserisce i propri dati (step "Dati") e infine rivede
 * e conferma la prenotazione (step "Conferma"). Tutto lo stato del flusso vive
 * qui così i dati sopravvivono al passaggio tra gli step e sono mostrabili nel
 * riepilogo finale prima dell'invio.
 */
export default function BookingCalendar({ week }: BookingCalendarProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(0);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [form, setForm] = useState<BookingFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<BookingFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedDay = dayIndex !== null ? week[dayIndex] : null;
  const selectedSlot = useMemo<CalendarSlot | null>(
    () => selectedDay?.slots.find((s) => s.id === selectedSlotId) ?? null,
    [selectedDay, selectedSlotId]
  );

  function selectDay(index: number) {
    setDayIndex(index);
    setSelectedSlotId(null);
  }

  // Selezionare una fascia oraria porta subito allo step dei dati: ogni scelta
  // fa cambiare vista, come da flusso a wizard.
  function selectSlot(slot: CalendarSlot) {
    setSelectedSlotId(slot.id);
    setStep(1);
  }

  function patchForm(patch: Partial<BookingFormData>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // Step "Dati" → "Conferma": valida prima di mostrare il riepilogo.
  function goToReview() {
    const nextErrors = validateBookingData(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setFormError(null);
    setStep(2);
  }

  async function submit() {
    if (!selectedSlot) return;
    setFormError(null);
    setSubmitting(true);

    const result = await createBooking({
      slotStart: selectedSlot.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    if (!result.success) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }

    // Solo l'id della prenotazione nella URL: i dettagli vengono riletti dal DB
    // lato server, così nessun dato personale finisce nella URL.
    router.push(`/prenota/conferma?b=${result.data.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Avanzamento prenotazione" className="px-1">
        <Stepper current={step} />
      </nav>

      <div className="rounded-3xl border border-brand-surface-muted bg-white p-5 shadow-sm shadow-brand-primary/5 sm:p-7">
        {/* La chiave per-step fa ripartire l'animazione di ingresso a ogni
            cambio di vista del wizard. */}
        <div key={step} className="reveal">
          {step === 0 && (
            <StepOrario
              week={week}
              dayIndex={dayIndex}
              selectedDay={selectedDay}
              selectedSlotId={selectedSlotId}
              onSelectDay={selectDay}
              onSelectSlot={selectSlot}
            />
          )}

          {step === 1 && selectedDay && selectedSlot && (
            <StepDati
              day={selectedDay}
              slot={selectedSlot}
              values={form}
              errors={errors}
              onChange={patchForm}
              onBack={() => setStep(0)}
              onNext={goToReview}
            />
          )}

          {step === 2 && selectedDay && selectedSlot && (
            <StepConferma
              day={selectedDay}
              slot={selectedSlot}
              values={form}
              formError={formError}
              submitting={submitting}
              onBack={() => setStep(1)}
              onConfirm={submit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1 · Orario ──────────────────────────────────────────────────── */

interface StepOrarioProps {
  week: CalendarDay[];
  dayIndex: number | null;
  selectedDay: CalendarDay | null;
  selectedSlotId: string | null;
  onSelectDay: (index: number) => void;
  onSelectSlot: (slot: CalendarSlot) => void;
}

function StepOrario({
  week,
  dayIndex,
  selectedDay,
  selectedSlotId,
  onSelectDay,
  onSelectSlot,
}: StepOrarioProps) {
  const openSlots =
    selectedDay?.slots.filter((s) => SLOT_STATUS_META[s.status].selectable)
      .length ?? 0;

  // Quando l'utente sceglie un giorno, porta dolcemente in vista la sezione
  // degli orari: su mobile la striscia dei giorni può occupare tutto lo schermo
  // e gli slot finirebbero altrimenti sotto la piega.
  const slotsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (dayIndex === null) return;
    slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [dayIndex]);

  return (
    <div className="flex flex-col">
      {/* Striscia giorni */}
      <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2">
        {week.map((day, i) => {
          const meta = SLOT_STATUS_META[day.status];
          const isActive = i === dayIndex;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(i)}
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
          <section
            ref={slotsRef}
            key={selectedDay.date}
            className="reveal flex flex-col gap-4 scroll-mt-6"
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
              onSelect={onSelectSlot}
            />
          </section>
        </>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-brand-surface-muted bg-brand-surface/60 px-5 py-6 text-center text-sm text-brand-muted">
          Seleziona un giorno per vedere gli orari disponibili.
        </p>
      )}
    </div>
  );
}

/* ── Step 2 · Dati ────────────────────────────────────────────────────── */

interface StepDatiProps {
  day: CalendarDay;
  slot: CalendarSlot;
  values: BookingFormData;
  errors: BookingFieldErrors;
  onChange: (patch: Partial<BookingFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}

function StepDati({
  day,
  slot,
  values,
  errors,
  onChange,
  onBack,
  onNext,
}: StepDatiProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <SlotBanner day={day} slot={slot} />
      <h2 className="text-base font-semibold text-brand-primary sm:text-lg">
        I tuoi dati
      </h2>
      <BookingDataFields values={values} errors={errors} onChange={onChange} />
      <StepActions
        backLabel="Indietro"
        onBack={onBack}
        nextLabel="Rivedi e conferma"
        nextType="submit"
      />
    </form>
  );
}

/* ── Step 3 · Conferma ────────────────────────────────────────────────── */

interface StepConfermaProps {
  day: CalendarDay;
  slot: CalendarSlot;
  values: BookingFormData;
  formError: string | null;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function StepConferma({
  day,
  slot,
  values,
  formError,
  submitting,
  onBack,
  onConfirm,
}: StepConfermaProps) {
  return (
    <div className="flex flex-col gap-5">
      <SlotBanner day={day} slot={slot} />
      <h2 className="text-base font-semibold text-brand-primary sm:text-lg">
        Conferma la prenotazione
      </h2>

      <dl className="divide-y divide-brand-surface-muted overflow-hidden rounded-2xl border border-brand-surface-muted">
        <SummaryRow
          label="Quando"
          value={`${day.weekday} ${day.dayNumber} ${day.month} · ${slot.time}`}
        />
        <SummaryRow label="Nome" value={values.name.trim()} />
        <SummaryRow label="Email" value={values.email.trim() || "—"} />
        <SummaryRow label="Telefono" value={values.phone.trim() || "—"} />
      </dl>

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-status-full/20 bg-status-full/5 px-4 py-3 text-sm font-medium text-status-full"
        >
          {formError}
        </p>
      )}

      <StepActions
        backLabel="Indietro"
        onBack={onBack}
        nextLabel={submitting ? "Conferma in corso…" : "Conferma prenotazione"}
        nextType="button"
        onNext={onConfirm}
        nextDisabled={submitting}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-brand-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-brand-primary">
        {value}
      </dd>
    </div>
  );
}

/* ── Pezzi condivisi ──────────────────────────────────────────────────── */

/** Promemoria della fascia selezionata, mostrato negli step "Dati" e "Conferma". */
function SlotBanner({ day, slot }: { day: CalendarDay; slot: CalendarSlot }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-accent/15 bg-brand-accent/5 px-4 py-3 text-sm text-brand-primary">
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-accent"
        aria-hidden
      />
      <p>
        Stai prenotando per il{" "}
        <span className="font-semibold">
          {day.weekday} {day.dayNumber} {day.month}
        </span>{" "}
        alle <span className="font-semibold tabular-nums">{slot.time}</span>. Lo
        sportello ti verrà indicato sullo schermo quando il tuo turno sarà
        chiamato.
      </p>
    </div>
  );
}

interface StepActionsProps {
  backLabel: string;
  onBack: () => void;
  nextLabel: string;
  nextType: "button" | "submit";
  onNext?: () => void;
  nextDisabled?: boolean;
}

/** Barra di navigazione tra gli step: indietro (secondario) + avanti (primario). */
function StepActions({
  backLabel,
  onBack,
  nextLabel,
  nextType,
  onNext,
  nextDisabled,
}: StepActionsProps) {
  return (
    <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-surface-muted bg-white px-6 py-3 font-semibold text-brand-primary transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md hover:shadow-brand-primary/10 active:translate-y-0"
      >
        ← {backLabel}
      </button>
      <button
        type={nextType}
        onClick={nextType === "button" ? onNext : undefined}
        disabled={nextDisabled}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-7 py-3 font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-accent/35 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
      >
        {nextLabel}
      </button>
    </div>
  );
}

/* ── Stepper ──────────────────────────────────────────────────────────── */

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
