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
