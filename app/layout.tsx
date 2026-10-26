import "./globals.css";
import type { Metadata } from "next";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "FlexDesk - Réservation d'espaces de coworking",
  description: "Plateforme de réservation d'espaces de coworking et de salles de réunion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {/* Contenu de la page */}
        <main className="min-h-screen">{children}</main>

        {/* Widget ChatBot flottant - persistant sur toutes les pages */}
        <ChatWidget />
      </body>
    </html>
  );
}