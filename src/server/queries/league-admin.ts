import "server-only";

import { db } from "@/server/db/client";

/** Datos de la página de administración de una liga; la autorización ya la hizo el layout. */
export async function getLeagueAdmin(leagueId: string) {
  const [league, deductions] = await Promise.all([
    db.league.findUniqueOrThrow({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        semester: true,
        status: true,
        _count: { select: { matchdays: true } },
        teams: {
          orderBy: { nameKey: "asc" },
          select: {
            id: true,
            name: true,
            crest: { select: { hash: true } },
            players: { orderBy: { nameKey: "asc" }, select: { id: true, name: true } },
          },
        },
      },
    }),
    db.pointDeduction.findMany({
      where: { team: { leagueId } },
      // En el orden en que se aplicaron (RF-67).
      orderBy: { createdAt: "asc" },
      select: { id: true, points: true, reason: true, team: { select: { id: true, name: true } } },
    }),
  ]);
  const finalized = league.status === "FINALIZED";
  return {
    id: league.id,
    name: league.name,
    semester: league.semester,
    finalized,
    // RF-23, RF-24: equipos solo mientras la liga está en curso y sin fechas.
    canChangeTeams: !finalized && league._count.matchdays === 0,
    teams: league.teams.map((team) => ({
      id: team.id,
      name: team.name,
      crestHash: team.crest?.hash ?? null,
      players: team.players,
    })),
    deductions: deductions.map(({ team, ...deduction }) => ({
      ...deduction,
      teamId: team.id,
      teamName: team.name,
    })),
  };
}
