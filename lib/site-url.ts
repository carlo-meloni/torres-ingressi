/**
 * URL pubblico assoluto del sito. Usato come `metadataBase` (per OG/canonical),
 * e da `robots.ts` / `sitemap.ts`.
 *
 * In produzione impostare `NEXT_PUBLIC_SITE_URL` (es. https://biglietteria.torres.it).
 * In sviluppo si ricade su localhost.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
