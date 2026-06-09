import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PagePlaceholder } from "@/components/admin/PagePlaceholder";

/** Gestione utenti: riservata a `SYSADMIN`. */
export default async function UtentiPage() {
  const session = await auth();
  if (session?.user.role !== "SYSADMIN") {
    redirect("/admin");
  }

  return (
    <PagePlaceholder
      title="Utenti"
      description="Gestisci gli account e i ruoli (solo sysadmin)."
    />
  );
}
