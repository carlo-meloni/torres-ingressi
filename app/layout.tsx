import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Torres Biglietteria",
  description:
    "Prenota il tuo turno alla biglietteria della Torres Sassari: scegli giorno e orario, niente più code disordinate.",
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
