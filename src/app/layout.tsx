import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LatamAI Web",
  description:
    "Agente de IA de texto especializado en Latinoamerica: paises, biodiversidad, cultura, comida y defensa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="light"
      data-theme-mode="auto"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
