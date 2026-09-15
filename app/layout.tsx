import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cabañas Rancho La Joya | Amealco, Querétaro",
    template: "%s | Rancho La Joya",
  },
  description:
    "Cabañas Rancho La Joya en Amealco, Querétaro. Elige tu cabaña, consulta tus fechas y solicita una estancia en la naturaleza.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">{children}</body>
    </html>
  );
}
