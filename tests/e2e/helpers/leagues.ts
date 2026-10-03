import { queryDatabase } from "./accounts";

/** Semestre de un día según el corte de RF-17, en la zona horaria de la app (ADR 015). */
function semesterOf(date: Date): string {
  const [year, month] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);
  return `${year}-${month! <= 7 ? 1 : 2}`;
}

/** Semestre actual, el mismo que calcula el servidor. */
export const currentSemester = () => semesterOf(new Date());

/** Semestre inmediatamente anterior al actual. */
export function previousSemester(): string {
  const [year, half] = currentSemester().split("-").map(Number);
  return half === 2 ? `${year}-1` : `${year! - 1}-2`;
}

export const uniqueLeagueName = () => `Liga ${crypto.randomUUID().slice(0, 8)}`;

/**
 * Crea una liga de un ayudante directo en la base (ADR 019), para preparar
 * estados que la interfaz todavía no permite crear, como una liga finalizada.
 */
export async function seedLeague(
  ownerEmail: string,
  options: { name?: string; semester?: string; status?: "IN_PROGRESS" | "FINALIZED" } = {},
) {
  const [owner] = await queryDatabase<{ id: string }>('SELECT id FROM "user" WHERE email = $1', [
    ownerEmail,
  ]);
  const id = crypto.randomUUID();
  const name = options.name ?? uniqueLeagueName();
  const status = options.status ?? "IN_PROGRESS";
  await queryDatabase(
    `INSERT INTO league (id, "ownerId", name, "nameKey", semester, status, "finalizedAt", "updatedAt")
     VALUES ($1, $2, $3, lower($3), $4, $5::"LeagueStatus", $6, now())`,
    [
      id,
      owner!.id,
      name,
      options.semester ?? currentSemester(),
      status,
      status === "FINALIZED" ? new Date() : null,
    ],
  );
  return { id, name };
}

/** Crea un equipo con escudo en una liga, directo en la base. */
export async function seedTeamWithCrest(leagueId: string, name = "Los Tigres") {
  const id = crypto.randomUUID();
  await queryDatabase(
    `INSERT INTO team (id, "leagueId", name, "nameKey") VALUES ($1, $2, $3, lower($3))`,
    [id, leagueId, name],
  );
  await queryDatabase(
    `INSERT INTO team_crest ("teamId", data, hash, "updatedAt") VALUES ($1, '\\x00'::bytea, 'h', now())`,
    [id],
  );
  return { id };
}

/** Crea un equipo sin escudo, directo en la base. */
export async function seedTeam(leagueId: string, name: string) {
  const id = crypto.randomUUID();
  await queryDatabase(
    `INSERT INTO team (id, "leagueId", name, "nameKey") VALUES ($1, $2, $3, lower($3))`,
    [id, leagueId, name],
  );
  return { id, name };
}

/** Crea un jugador de un equipo, directo en la base. */
export async function seedPlayer(leagueId: string, teamId: string, name: string) {
  const id = crypto.randomUUID();
  await queryDatabase(
    `INSERT INTO player (id, "leagueId", "teamId", name, "nameKey") VALUES ($1, $2, $3, $4, lower($4))`,
    [id, leagueId, teamId, name],
  );
  return { id, name };
}

/** Crea una fecha de la liga, directo en la base. */
export async function seedMatchday(leagueId: string, playDate = "2026-09-01") {
  const id = crypto.randomUUID();
  await queryDatabase(`INSERT INTO matchday (id, "leagueId", "playDate") VALUES ($1, $2, $3)`, [
    id,
    leagueId,
    playDate,
  ]);
  return { id };
}

/** Partido terminado con un gol del jugador, en una fecha nueva de la liga. */
export async function seedGoal(
  leagueId: string,
  match: { teamAId: string; teamBId: string },
  scorer: { id: string; teamId: string },
) {
  const matchday = await seedMatchday(leagueId);
  const matchId = crypto.randomUUID();
  await queryDatabase(
    `INSERT INTO match (id, "matchdayId", position, "teamAId", "teamBId", status)
     VALUES ($1, $2, 1, $3, $4, 'FINISHED')`,
    [matchId, matchday.id, match.teamAId, match.teamBId],
  );
  await queryDatabase(
    `INSERT INTO goal (id, "matchId", "teamId", "scorerId") VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), matchId, scorer.teamId, scorer.id],
  );
}
