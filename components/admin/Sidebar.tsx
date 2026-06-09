"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";

type NavItem = {
  href: string;
  label: string;
  /** Se valorizzato, voce visibile solo a questi ruoli. */
  roles?: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sportelli", label: "Sportelli" },
  { href: "/admin/aperture", label: "Aperture" },
  { href: "/admin/prenotazioni", label: "Prenotazioni" },
  { href: "/admin/utenti", label: "Utenti", roles: ["SYSADMIN"] },
];

/**
 * Navigazione laterale dell'area admin con evidenziazione della rotta attiva.
 * Le voci ristrette (es. Utenti) sono mostrate solo ai ruoli abilitati.
 */
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
        (item) => {
          // `/admin` è attivo solo in match esatto; le altre voci anche sulle
          // rotte figlie (es. `/admin/sportelli/123`).
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-md px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
              }
            >
              {item.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
