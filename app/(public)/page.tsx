import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.webp";
import { getHeroContent } from "@/lib/site-content";

// I testi dell'hero sono modificabili dal SYSADMIN (DB): rendi la pagina
// dinamica così che ogni salvataggio sia subito visibile.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Scegli il giorno",
    description:
      "Apri il calendario e trova le giornate con gli sportelli aperti.",
  },
  {
    title: "Prenota il turno",
    description:
      "Seleziona una fascia oraria libera e conferma con i tuoi dati.",
  },
  {
    title: "Passa allo sportello",
    description:
      "Ricevi il tuo numero di turno e presentati all'orario indicato.",
  },
] as const;

/** Landing pubblica: presenta la biglietteria e invita alla prenotazione. */
export default async function LandingPage() {
  const hero = await getHeroContent();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-linear-to-b from-brand-primary-dark via-brand-primary to-brand-primary-dark text-white">
        {/* Stemma in filigrana */}
        <Image
          src={logo}
          alt=""
          aria-hidden
          width={420}
          height={551}
          priority
          className="pointer-events-none absolute -right-10 top-1/2 hidden w-[clamp(16rem,32vw,30rem)] -translate-y-1/2 opacity-[0.06] md:block"
        />
        {/* Bagliori: accento a sinistra, navy chiaro a destra */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-112 w-md rounded-full bg-brand-accent/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-brand-primary-light/30 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-8 px-6 py-24 sm:py-32">
          {/* <span className="reveal reveal-1 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-brand-gold"
            />
            Torres Sassari
          </span> */}

          {/* Titolo multilinea: gli a capo del testo salvato diventano righe. */}
          <h1 className="reveal reveal-1 max-w-3xl whitespace-pre-line text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>

          <p className="reveal reveal-2 max-w-xl whitespace-pre-line text-lg leading-relaxed text-white/70">
            {hero.subtitle}
          </p>

          <div className="reveal reveal-3 flex flex-wrap items-center gap-4 pt-1">
            <Link
              href="/prenota"
              className="group rounded-full bg-brand-accent px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-accent-hover hover:shadow-xl hover:shadow-brand-accent/30 focus-visible:outline-white active:translate-y-0"
            >
              Prenota ora{" "}
              <span
                aria-hidden
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="/display"
              className="rounded-full border border-white/20 px-7 py-3.5 font-semibold text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5 hover:text-white focus-visible:outline-white active:translate-y-0"
            >
              Coda in tempo reale
            </Link>
          </div>
        </div>

        {/* Hairline oro sul bordo inferiore */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-brand-gold/60 to-transparent"
        />
      </section>

      {/* ── Come funziona ────────────────────────────────────────────── */}
      {/* <section id="info" className="mx-auto w-full max-w-5xl px-5 py-20 sm:py-24">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
            Come funziona
          </span>
          <h2 className="max-w-md text-3xl font-bold text-brand-primary sm:text-4xl">
            Tre passaggi per saltare l&apos;attesa
          </h2>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group relative flex flex-col gap-4 rounded-2xl border border-brand-surface-muted bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-brand-primary/5"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-brand-primary text-lg font-bold text-white transition-colors duration-300 group-hover:bg-brand-accent">
                {i + 1}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-brand-primary">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-muted">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section> */}

      {/* ── CTA finale ───────────────────────────────────────────────── */}
      {/* <section className="mx-auto w-full max-w-5xl px-5 pb-24">
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-linear-to-br from-brand-primary to-brand-primary-light px-6 py-16 text-center text-white">
          <Image
            src={logo}
            alt=""
            aria-hidden
            width={200}
            height={262}
            className="pointer-events-none absolute -bottom-8 -right-6 w-40 opacity-[0.07]"
          />
          <h2 className="relative text-3xl font-bold sm:text-4xl">
            Pronto a prenotare?
          </h2>
          <p className="relative max-w-md text-white/75">
            Bastano pochi secondi. Scegli la tua fascia oraria e salta la coda.
          </p>
          <Link
            href="/prenota"
            className="relative rounded-full bg-brand-accent px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-accent-hover hover:shadow-xl hover:shadow-brand-accent/30"
          >
            Vai al calendario
          </Link>
        </div>
      </section> */}
    </>
  );
}
