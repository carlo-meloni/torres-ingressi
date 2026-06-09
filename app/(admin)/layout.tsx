import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import logo from "@/public/logo.webp";

/**
 * Layout dell'area admin/sysadmin (auth). Guardia RBAC lato server:
 * - non autenticato → sign-in (conservando il callback);
 * - `BIGLIETTAIO` (senza permessi admin) → landing pubblica.
 *
 * `auth()` legge i cookie, quindi l'intero segmento `(admin)` è renderizzato
 * dinamicamente: le query Prisma delle pagine girano a ogni richiesta.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SYSADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-full bg-brand-surface text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-brand-surface-muted bg-brand-primary text-white md:flex">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5 transition-opacity hover:opacity-90"
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
            Torres Admin
          </span>
        </Link>

        <Sidebar role={role} />

        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">
            {session.user.name ?? session.user.email}
          </p>
          <p className="text-xs text-white/50">{role}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="mt-3 w-full rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
            >
              Esci
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
