import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Coppia tipografica: Inter (testo) + Archivo (titoli, look sportivo).
// Entrambi variable font — nessun peso da dichiarare.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const SITE_NAME = "Torres Biglietteria";
const DEFAULT_TITLE = "Torres Biglietteria — Prenota il tuo turno";
const DESCRIPTION =
  "Prenota il tuo turno alla biglietteria della Torres Sassari: scegli giorno e orario, niente più code disordinate.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITE_NAME,
    url: "/",
    title: DEFAULT_TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/logo.webp",
        width: 420,
        height: 551,
        alt: "Stemma Torres Sassari",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: DESCRIPTION,
    images: ["/logo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
