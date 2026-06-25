import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Sitemap statica delle pagine pubbliche indicizzabili. Non ci sono rotte
 * dinamiche pubbliche: la conferma di prenotazione è `noindex` (dati personali)
 * e le aree autenticate sono escluse anche dal `robots.txt`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/prenota`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/display`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.4,
    },
  ];
}
