"use client";

import type { BookingFormData } from "@/types/booking";

export interface BookingFieldErrors {
  name?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida i dati del form lato client per un feedback immediato. La validazione
 * autorevole resta nella Server Action `createBooking`; qui controlliamo solo
 * il minimo necessario a guidare l'utente (nome presente, email ben formata).
 */
export function validateBookingData(values: BookingFormData): BookingFieldErrors {
  const errors: BookingFieldErrors = {};
  if (values.name.trim().length < 2) errors.name = "Inserisci il tuo nome.";
  if (values.email.trim() && !EMAIL_RE.test(values.email.trim()))
    errors.email = "Inserisci un'email valida.";
  return errors;
}

interface BookingDataFieldsProps {
  values: BookingFormData;
  errors: BookingFieldErrors;
  onChange: (patch: Partial<BookingFormData>) => void;
}

/**
 * Campi dati della prenotazione (nome, email, telefono). Componente controllato:
 * lo stato vive nel wizard (`BookingCalendar`) così i valori sopravvivono al
 * passaggio tra gli step e sono rileggibili nella schermata di conferma.
 */
export function BookingDataFields({
  values,
  errors,
  onChange,
}: BookingDataFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Nome e cognome" error={errors.name} required>
        <input
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Mario Rossi"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
        />
      </Field>

      <Field label="Email" error={errors.email} hint="Per la conferma (opzionale)">
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="mario@esempio.it"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
        />
      </Field>

      <Field label="Telefono" hint="Opzionale">
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="333 1234567"
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
        />
      </Field>
    </div>
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
        {hint && <span className="font-normal text-brand-muted">— {hint}</span>}
      </span>
      {children}
      {error && <span className="text-xs text-status-full">{error}</span>}
    </label>
  );
}
