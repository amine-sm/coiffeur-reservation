import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Configuration des polices pour un look "Luxe"
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "PRESTIGE | Salon de Coiffure Privé Alger",
  description: "Découvrez l'excellence de la coiffure masculine à Hydra. Réservation en ligne pour des coupes signature et soins premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // L'attribut data-scroll-behavior="smooth" corrige l'avertissement Next.js
    <html lang="fr" data-scroll-behavior="smooth" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-[#050505] text-white selection:bg-[#FBBF24] selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}