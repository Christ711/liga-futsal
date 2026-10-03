import "server-only";

import { checkCanGenerateMatchday } from "@/domain/league-rules";
import { validatePlayDate } from "@/domain/matchdays";
import { fail, ok, type Result } from "@/domain/result";
import { scheduleMatchday } from "@/domain/scheduling";
import { sessionUser } from "@/server/auth/session-user";
import { leagueStatus, requireOwnedLeague } from "@/server/authz";
import { db } from "@/server/db/client";
import { toDbDay } from "@/server/db/days";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicatePlayDate } from "./matchday-days";

/**
 * Genera una fecha: todos contra todos, con los partidos pendientes y en el
 * orden del dominio (RF-41, RF-42, RF-44, RF-45, RF-99, RF-100).
 */
export async function generateMatchday(
  leagueId: string,
  input: { playDate: string },
  requestHeaders: Headers,
): Promise<Result<{ id: string }>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedLeague(user.id, leagueId);
  if (!owned.ok) return owned;
  const playDate = validatePlayDate(input.playDate);
  if (!playDate.ok) return playDate;

  try {
    return await db.$transaction(async (tx) => {
      // Bloquea la liga: dos generaciones simultáneas no pueden dejar dos fechas abiertas.
      await tx.$queryRaw`SELECT id FROM league WHERE id = ${leagueId} FOR UPDATE`;
      const [teams, openMatchdays] = await Promise.all([
        tx.team.findMany({ where: { leagueId }, select: { id: true } }),
        tx.matchday.count({ where: { leagueId, finalizedAt: null } }),
      ]);
      const allowed = checkCanGenerateMatchday({
        status: leagueStatus(owned.data),
        teamCount: teams.length,
        hasOpenMatchday: openMatchdays > 0,
      });
      if (!allowed.ok) return allowed;

      // RF-45: el primer partido no repite el que abrió la fecha anterior en el calendario.
      const previous = await tx.matchday.findFirst({
        where: { leagueId, playDate: { lt: toDbDay(playDate.data) } },
        orderBy: { playDate: "desc" },
        select: {
          matches: {
            orderBy: { position: "asc" },
            take: 1,
            select: { teamAId: true, teamBId: true },
          },
        },
      });
      const order = scheduleMatchday({
        teamIds: teams.map((team) => team.id),
        random: Math.random,
        previousOpener: previous?.matches[0] ?? null,
      });

      const matchday = await tx.matchday.create({
        data: {
          leagueId,
          playDate: toDbDay(playDate.data),
          matches: {
            create: order.map((pairing, index) => ({ ...pairing, position: index + 1 })),
          },
        },
        select: { id: true },
      });
      return ok(matchday);
    });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicatePlayDate();
    throw error;
  }
}
