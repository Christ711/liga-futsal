import { nameKey } from "@/domain/names";
import { db } from "@/server/db/client";

/**
 * Fixtures de pruebas (ADR 019): crean datos directamente con Prisma,
 * respetando las mismas restricciones que los casos de uso, con nombres y
 * correos únicos para que el orden de ejecución no importe.
 */
const unique = () => crypto.randomUUID().slice(0, 8);

export async function createUser() {
  const id = crypto.randomUUID();
  return db.user.create({
    data: { id, name: "", email: `ayudante-${id}@example.com` },
  });
}

export async function createLeague(
  overrides: { ownerId?: string; name?: string; semester?: string } = {},
) {
  const ownerId = overrides.ownerId ?? (await createUser()).id;
  const name = overrides.name ?? `Liga ${unique()}`;
  return db.league.create({
    data: { ownerId, name, nameKey: nameKey(name), semester: overrides.semester ?? "2026-2" },
  });
}

export async function createTeam(leagueId: string, name = `Equipo ${unique()}`) {
  return db.team.create({ data: { leagueId, name, nameKey: nameKey(name) } });
}

export async function createPlayer(leagueId: string, teamId: string, name = `Jugador ${unique()}`) {
  return db.player.create({ data: { leagueId, teamId, name, nameKey: nameKey(name) } });
}

/** Partido terminado entre dos equipos, en una fecha nueva de la liga. */
export async function createFinishedMatch(leagueId: string, teamAId: string, teamBId: string) {
  // Días consecutivos desde el 1 de agosto: no hay dos fechas el mismo día (RF-99).
  const previous = await db.matchday.count({ where: { leagueId } });
  const matchday = await db.matchday.create({
    data: { leagueId, playDate: new Date(Date.UTC(2026, 7, 1 + previous)) },
  });
  return db.match.create({
    data: { matchdayId: matchday.id, position: 1, teamAId, teamBId, status: "FINISHED" },
  });
}

export async function createGoal(matchId: string, teamId: string, scorerId: string | null) {
  return db.goal.create({ data: { matchId, teamId, scorerId } });
}
