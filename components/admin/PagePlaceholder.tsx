/**
 * Segnaposto per le pagine admin non ancora implementate. Mantiene la
 * navigazione coerente mentre le singole sezioni vengono sviluppate.
 */
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-brand-primary">{title}</h1>
        <p className="text-sm text-brand-muted">{description}</p>
      </header>

      <div className="grid place-items-center rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-20 text-center">
        <p className="text-sm font-medium text-brand-muted">
          Sezione in costruzione.
        </p>
      </div>
    </div>
  );
}
