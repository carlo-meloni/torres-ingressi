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
      <header className="sticky top-0 z-20 h-28 flex items-center bg-black color-white backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-center gap-8 pl-24">
          <Link
            href="/"
            className="group flex  items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <Image
              src={logo}
              alt="Stemma Torres Sassari"
              width={54}
              height={54}
              priority
              className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-[1rem]  tracking-tight text-white uppercase">
               Biglietteria
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            
          </div>
        </nav>
            <Link
              href="/prenota"
              className="mx-4 rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-accent-hover hover:shadow-md hover:shadow-brand-accent/30"
            >
              Prenota
            </Link>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-black text-white/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Image
              src={logo}
              alt=""
              aria-hidden
              width={24}
              height={32}
              className="h-7 w-auto"
            />
            <span>
              © {new Date().getFullYear()} Torres Sassari — Biglietteria
            </span>
          </div>
          <Link
            href="/display"
            className="rounded-md font-medium transition-colors hover:text-white"
          >
            Schermo pubblico coda →
          </Link>
        </div>
      </footer>
    </div>
  );
}
