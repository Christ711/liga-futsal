import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { requireSession } from "@/server/auth/session";

/** Vistas de administración: exigen sesión y montan la caché de TanStack Query (ADR 011). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <QueryProvider>{children}</QueryProvider>;
}
