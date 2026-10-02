import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { getSession } from "@/server/auth/session";

import { signOutAction } from "./ingresar/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liga Futsal",
  description: "Tablas de posiciones y goleadores de las ligas internas.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <html lang="es-CL">
      <body className="min-h-dvh antialiased">
        <SiteHeader signedIn={session !== null} signOutAction={signOutAction} />
        {children}
      </body>
    </html>
  );
}
