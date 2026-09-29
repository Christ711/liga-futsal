import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Liga Futsal",
  description: "Tablas de posiciones y goleadores de las ligas internas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
