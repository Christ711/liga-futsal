import "server-only";

import { buildSnapshot } from "@/domain/snapshot";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedLeague } from "@/server/authz";
import { db } from "@/server/db/client";
import { DOMAIN_MATCH_SELECT, toDomainMatch } from "@/server/db/matches";
import { now } from "@/server/time";

/**
 * Finaliza una liga en curso: guarda sus tablas finales, borra fechas,
 * partidos, goles y descuentos, y conserva equipos, escudos y jugadores
 * (RF-74, RF-75, RF-77; plan D7). Desde ahí no admite cambios (RF-76).
 */
export async function finalizeLeague(
  leagueId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedLeague(user.id, leagueId, { mustBeInProgress: true });
  if (!owned.ok) return owned;

  await db.$transaction(async (tx) => {
    const [teams, players, matches, deductions] = await Promise.all([
      tx.team.findMany({ where: { leagueId }, select: { id: true, name: true } }),
      tx.player.findMany({ where: { leagueId }, select: { id: true, name: true, teamId: true } }),
      tx.match.findMany({ where: { matchday: { leagueId } }, select: DOMAIN_MATCH_SELECT }),
      tx.pointDeduction.findMany({
        where: { team: { leagueId } },
        orderBy: { createdAt: "asc" },
        select: { teamId: true, points: true, reason: true },
      }),
    ]);
    const snapshot = buildSnapshot({
      teams,
      players,
      matches: matches.map(toDomainMatch),
      deductions,
    });

    await tx.leagueSnapshot.create({ data: { leagueId, ...snapshot } });
    // Borrar las fechas borra en cascada sus partidos y goles.
    await tx.matchday.deleteMany({ where: { leagueId } });
    await tx.pointDeduction.deleteMany({ where: { team: { leagueId } } });
    await tx.league.update({
      where: { id: leagueId },
      data: { status: "FINALIZED", finalizedAt: now() },
    });
  });
  return ok(null);
}
