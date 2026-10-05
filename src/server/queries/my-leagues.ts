import "server-only";

import { isSemesterOver } from "@/domain/semester";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db/client";
import { today } from "@/server/time";

export type MyLeague = { id: string; name: string; semester: string };

/**
 * Ligas de un ayudante, separadas en curso y finalizadas, del semestre más
 * reciente al más antiguo (RF-21, RF-22). Marca las en curso de un semestre
 * ya terminado (RF-94).
 */
export async function getMyLeagues(userId: string) {
  return splitLeagues({ ownerId: userId });
}

/**
 * Ligas de los demás ayudantes, para una cuenta administradora (RF-110). Solo
 * nombre y semestre: nunca datos de sus dueños (RF-14).
 */
export async function getOtherLeagues(userId: string) {
  return splitLeagues({ ownerId: { not: userId } });
}

async function splitLeagues(where: Prisma.LeagueWhereInput) {
  const leagues = await db.league.findMany({
    where,
    select: { id: true, name: true, semester: true, status: true },
    orderBy: [{ semester: "desc" }, { nameKey: "asc" }],
  });
  const day = today();
  return {
    inProgress: leagues
      .filter((league) => league.status === "IN_PROGRESS")
      .map(({ id, name, semester }) => ({
        id,
        name,
        semester,
        semesterOver: isSemesterOver(semester, day),
      })),
    finalized: leagues
      .filter((league) => league.status === "FINALIZED")
      .map(({ id, name, semester }): MyLeague => ({ id, name, semester })),
  };
}
