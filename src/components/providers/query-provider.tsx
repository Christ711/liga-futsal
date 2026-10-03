"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Caché de TanStack Query de las vistas autenticadas (ADR 011). Las páginas
 * públicas no lo montan.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Un cliente por sesión del navegador; useState evita recrearlo en cada render.
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
