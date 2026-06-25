"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarDay, CalendarSlot } from "@/types/booking";
import { createBooking } from "@/actions/bookings";

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
 * Form di prenotazione per lo slot selezionato. Valida lato client per un
 * feedback immediato, poi delega la creazione (e l'assegnazione del numero di
 * turno) alla Server Action `createBooking`; al successo reindirizza alla
 * pagina di conferma con i dati reali della prenotazione.
 */
export default function BookingForm({ day, slot }: BookingFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    const nextErrors: FieldErrors = {};
    if (name.length < 2) nextErrors.name = "Inserisci il tuo nome.";
    if (email && !EMAIL_RE.test(email))
      nextErrors.email = "Inserisci un'email valida.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError(null);
    setSubmitting(true);

    const result = await createBooking({
      slotStart: slot.id,
      name,
      email,
      phone,
    });
    if (!result.success) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }

    // Solo l'id della prenotazione nella URL: i dettagli (nome, email, turno)
    // vengono riletti dal DB lato server, così nessun dato personale finisce
    // nella URL, nella cronologia o nei referer.
    router.push(`/prenota/conferma?b=${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
          alle <span className="font-semibold tabular-nums">{slot.time}</span>.
          Lo sportello ti verrà indicato sullo schermo quando il tuo turno sarà
          chiamato.
        </p>
      </div>

      <Field label="Nome e cognome" error={errors.name} required>
        <input
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Mario Rossi"
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
        />
      </Field>

      <Field label="Email" error={errors.email} hint="Per la conferma (opzionale)">
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="mario@esempio.it"
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
        />
      </Field>

      <Field label="Telefono" hint="Opzionale">
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="333 1234567"
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
        />
      </Field>

      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-status-full/20 bg-status-full/5 px-4 py-3 text-sm font-medium text-status-full"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-7 py-3 font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-accent/35 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 max-sm:w-full max-sm:self-stretch"
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
