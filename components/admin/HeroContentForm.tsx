"use client";

import { useState, useTransition } from "react";

import { updateHeroContent } from "@/actions/site-content";
import { heroContentSchema } from "@/lib/schemas/site-content";
import type { HeroContent } from "@/lib/site-content";

type Toast = { id: number; kind: "success" | "error"; message: string };

/**
 * Editor (riservato a `SYSADMIN`) dei testi dell'hero della landing pubblica.
 * Titolo e sottotitolo sono multilinea: gli a capo vengono preservati nel sito.
 */
export function HeroContentForm({ initial }: { initial: HeroContent }) {
  // `saved` è l'ultimo valore confermato dal server; `title`/`subtitle` sono in
  // editing. Il confronto fra i due determina lo stato "modificato" (`dirty`).
  const [saved, setSaved] = useState(initial);
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, startTransition] = useTransition();

  const dirty = title !== saved.title || subtitle !== saved.subtitle;

  function notify(kind: Toast["kind"], message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = heroContentSchema.safeParse({ title, subtitle });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateHeroContent(parsed.data);
      if (result.success) {
        // Riallinea il riferimento "salvato" così che `dirty` torni falso.
        setSaved({ title: parsed.data.title, subtitle: parsed.data.subtitle });
        setTitle(parsed.data.title);
        setSubtitle(parsed.data.subtitle);
        notify("success", "Contenuti aggiornati.");
      } else {
        notify("error", result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-brand-primary">Contenuti</h1>
        <p className="text-sm text-brand-muted">
          Modifica il titolo e il sottotitolo mostrati nell&apos;hero della
          pagina pubblica. Gli a capo nel titolo vengono mantenuti.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5 rounded-2xl border border-brand-surface-muted bg-white p-6 shadow-sm"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Titolo <span className="text-brand-accent">*</span>
          </span>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Prelazione Abbonamenti 2026-2027"
            className="w-full resize-y rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
          <span className="text-xs text-brand-muted">
            Ogni riga va a capo nell&apos;hero.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Sottotitolo <span className="text-brand-accent">*</span>
          </span>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={3}
            placeholder="Scegli giorno e orario dal calendario…"
            className="w-full resize-y rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
        </label>

        {error && <p className="text-xs text-status-full">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending || !dirty}
            className="inline-flex items-center justify-center rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? "Salvataggio…" : "Salva modifiche"}
          </button>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setTitle(saved.title);
                setSubtitle(saved.subtitle);
                setError(null);
              }}
              disabled={pending}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-surface disabled:opacity-60"
            >
              Annulla
            </button>
          )}
        </div>
      </form>

      <ToastViewport toasts={toasts} />
    </div>
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
