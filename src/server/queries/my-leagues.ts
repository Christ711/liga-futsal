import "server-only";

import { isSemesterOver } from "@/domain/semester";
import { db } from "@/server/db/client";
import { today } from "@/server/time";

export type MyLeague = { id: string; name: string; semester: string };

/**
 * Ligas de un ayudante, separadas en curso y finalizadas, del semestre más
 * reciente al más antiguo (RF-21, RF-22). Marca las en curso de un semestre
 * ya terminado (RF-94).
 */
export async function getMyLeagues(userId: string) {
  const leagues = await db.league.findMany({
    where: { ownerId: userId },
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
