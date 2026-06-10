import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import logo from "@/public/logo.webp";

/**
 * Layout dell'area cassa (auth). La coda è gestita da `BIGLIETTAIO`, `ADMIN` e
 * `SYSADMIN`: qualsiasi utente autenticato può accedere. Non autenticato →
 * sign-in conservando il callback. `auth()` legge i cookie, quindi l'intero
 * segmento `(cassa)` è renderizzato dinamicamente.
 */
export default async function CassaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/coda");
  }

  return (
    <div className="flex min-h-full flex-col bg-brand-surface text-foreground">
      <header className="flex items-center justify-between border-b border-brand-surface-muted bg-brand-primary px-5 py-3 text-white sm:px-8">
        <Link
          href="/coda"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Image
            src={logo}
            alt="Stemma Torres Sassari"
            width={28}
            height={37}
            priority
            className="h-8 w-auto"
          />
          <span className="text-[0.95rem] font-semibold tracking-tight">
            Torres Cassa
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-medium leading-tight">
              {session.user.name ?? session.user.email}
            </span>
            <span className="block text-xs text-white/50">
              {session.user.role}
            </span>
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
            >
              Esci
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
