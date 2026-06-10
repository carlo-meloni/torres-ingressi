import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";


const lato = Lato(
  {
    weight: ["400", "700"],
    subsets: ["latin"],
    variable: "--font-lato",
  },

)

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
      className={`${lato.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
