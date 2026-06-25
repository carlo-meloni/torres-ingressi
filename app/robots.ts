import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * `robots.txt` generato. Indicizzabile solo la parte pubblica informativa:
 * le aree autenticate (`/admin`, `/coda`), le API e la conferma di
 * prenotazione (dati personali, una per utente) restano fuori dall'indice.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/coda", "/api/", "/prenota/conferma"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
