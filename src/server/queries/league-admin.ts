import "server-only";

import { db } from "@/server/db/client";

/** Datos de la página de administración de una liga; la autorización ya la hizo el layout. */
export async function getLeagueAdmin(leagueId: string) {
  const league = await db.league.findUniqueOrThrow({
    where: { id: leagueId },
    select: { id: true, name: true, semester: true, status: true },
  });
  return { ...league, finalized: league.status === "FINALIZED" };
}
