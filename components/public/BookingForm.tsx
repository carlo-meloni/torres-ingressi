"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarDay, CalendarSlot } from "@/types/booking";

interface BookingFormProps {
  day: CalendarDay;
  slot: CalendarSlot;
}

interface FieldErrors {
  name?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Form di prenotazione per lo slot selezionato. Con i dati mockati genera un
 * numero di turno fittizio e reindirizza alla pagina di conferma; la
 * creazione reale passerà da una Server Action.
 */
export default function BookingForm({ day, slot }: BookingFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    const nextErrors: FieldErrors = {};
    if (name.length < 2) nextErrors.name = "Inserisci il tuo nome.";
    if (email && !EMAIL_RE.test(email))
      nextErrors.email = "Inserisci un'email valida.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);

    // Mock: numero di turno fittizio finché non c'è la persistenza reale.
    const ticketNumber = Math.floor(Math.random() * 80) + 20;

    const params = new URLSearchParams({
      ticket: String(ticketNumber),
      name,
      date: day.date,
      time: slot.time,
      counter: slot.counterName,
    });
    if (email) params.set("email", email);
    if (phone) params.set("phone", phone);

    router.push(`/prenota/conferma?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="rounded-xl bg-brand-surface px-4 py-3 text-sm text-brand-primary">
        Stai prenotando per il{" "}
        <span className="font-semibold">
          {day.weekday} {day.dayNumber} {day.month}
        </span>{" "}
        alle <span className="font-semibold">{slot.time}</span> —{" "}
        {slot.counterName}
      </div>

      <Field label="Nome e cognome" error={errors.name} required>
        <input
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Mario Rossi"
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-brand-accent"
        />
      </Field>

      <Field label="Email" error={errors.email} hint="Per la conferma (opzionale)">
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="mario@esempio.it"
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-brand-accent"
        />
      </Field>

      <Field label="Telefono" hint="Opzionale">
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="333 1234567"
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-brand-accent"
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-full bg-brand-accent px-6 py-3 font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-accent-hover hover:shadow-xl hover:shadow-brand-accent/30 disabled:pointer-events-none disabled:opacity-60"
      >
        {submitting ? "Conferma in corso…" : "Conferma prenotazione"}
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

/** Wrapper di un campo del form: etichetta, hint ed errore di validazione. */
function Field({ label, error, hint, required, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-brand-primary">
        {label}
        {required && <span className="text-brand-accent">*</span>}
        {hint && (
          <span className="font-normal text-brand-muted">— {hint}</span>
        )}
      </span>
      {children}
      {error && <span className="text-xs text-status-full">{error}</span>}
    </label>
  );
}
