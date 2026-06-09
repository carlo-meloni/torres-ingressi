import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserManager } from "@/components/admin/UserManager";
import { prisma } from "@/lib/prisma";
import type { UserListItem } from "@/types/user";

/**
 * Gestione utenti (riservata a `SYSADMIN`). Carica la lista lato server e delega
 * creazione/modifica/eliminazione alle Server Actions in `actions/users.ts`
 * tramite il componente client `UserManager`. La guardia di ruolo qui è
 * ridondante rispetto al layout, ma protegge anche le query di pagina.
 */
export default async function UtentiPage() {
  const session = await auth();
  if (session?.user.role !== "SYSADMIN") {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const initialUsers: UserListItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <UserManager initialUsers={initialUsers} currentUserId={session.user.id} />
  );
}
