import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.webp";

/**
 * Layout della parte pubblica (no auth): header translucido con navigazione
 * e footer. Avvolge landing, calendario prenotazioni e schermo pubblico.
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col bg-brand-surface text-foreground">
      <header className="sticky top-0 z-20  bg-brand-header ">
        <nav className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-6">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Biglietteria
            </span><Link
            href="/"
            className="group flex items-center gap-3 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-white"
          >
            <Image
              src={logo}
              alt="Stemma Torres Sassari"
              width={48}
              height={63}
              priority
              className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            
          </Link>

          <Link
            href="/prenota"
            className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-accent-hover hover:shadow-md hover:shadow-brand-accent/30 focus-visible:outline-white active:translate-y-0"
          >
            Prenota
          </Link>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-brand-gold/30 bg-brand-header  text-white/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src={logo}
              alt=""
              aria-hidden
              width={24}
              height={32}
              className="h-7 w-auto opacity-80"
            />
            <span>
              © {new Date().getFullYear()} Torres Sassari — Biglietteria
            </span>
          </div>
          <Link
            href="/display"
            className="group rounded-md font-medium transition-colors duration-200 hover:text-white focus-visible:outline-white"
          >
            Schermo pubblico coda{" "}
            <span
              aria-hidden
              className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
