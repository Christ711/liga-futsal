import "server-only";

import { db } from "@/server/db/client";

type HomeLeague = { id: string; name: string };
export type SemesterGroup = { semester: string; leagues: HomeLeague[] };

function bySemester(leagues: (HomeLeague & { semester: string })[]): SemesterGroup[] {
  const groups = new Map<string, HomeLeague[]>();
  for (const { semester, ...league } of leagues) {
    groups.set(semester, [...(groups.get(semester) ?? []), league]);
  }
  return [...groups].map(([semester, list]) => ({ semester, leagues: list }));
}

/**
 * Portada pública: ligas en curso y, después, el historial de finalizadas,
 * ambas agrupadas por semestre del más reciente al más antiguo (RF-80). Solo
 * nombre y semestre: nunca datos de los ayudantes (RF-14).
 */
export async function getHome() {
  const leagues = await db.league.findMany({
    select: { id: true, name: true, semester: true, status: true },
    // `AAAA-N`: el orden alfabético inverso es del más reciente al más antiguo.
    orderBy: [{ semester: "desc" }, { nameKey: "asc" }],
  });
  return {
    inProgress: bySemester(leagues.filter((league) => league.status === "IN_PROGRESS")),
    finalized: bySemester(leagues.filter((league) => league.status === "FINALIZED")),
  };
}
