import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gastus",
  description: "Controle de gastos fixos, parcelas e recorrentes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
