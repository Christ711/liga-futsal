import type { ReactNode } from "react";

import { loadOwnedLeague } from "./owned-league";

/** Toda ruta bajo una liga se autoriza aquí antes de renderizar (RF-13, RF-93). */
export default async function LeagueAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ leagueId: string }>;
}) {
  await loadOwnedLeague((await params).leagueId);
  return children;
}
