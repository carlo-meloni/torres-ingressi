import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HeroContentForm } from "@/components/admin/HeroContentForm";
import { getHeroContent } from "@/lib/site-content";

/**
 * Gestione contenuti editoriali del sito (riservata a `SYSADMIN`). Carica i
 * testi correnti dell'hero e delega il salvataggio alla Server Action in
 * `actions/site-content.ts`. La guardia di ruolo è ridondante rispetto al
 * layout, ma protegge anche la query di pagina.
 */
export default async function ContenutiPage() {
  const session = await auth();
  if (session?.user.role !== "SYSADMIN") {
    redirect("/admin");
  }

  const hero = await getHeroContent();

  return <HeroContentForm initial={hero} />;
}
