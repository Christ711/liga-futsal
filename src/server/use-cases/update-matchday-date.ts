import "server-only";

import { validatePlayDate } from "@/domain/matchdays";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatchday } from "@/server/authz";
import { db } from "@/server/db/client";
import { toDbDay } from "@/server/db/days";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicatePlayDate } from "./matchday-days";

/** Cambia el día de juego de una fecha; la numeración se recalcula sola (RF-43, RF-98, RF-99). */
export async function updateMatchdayDate(
  leagueId: string,
  matchdayId: string,
  input: { playDate: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedMatchday(user.id, leagueId, matchdayId, {
    mustBeInProgress: true,
  });
  if (!owned.ok) return owned;
  const playDate = validatePlayDate(input.playDate);
  if (!playDate.ok) return playDate;

  try {
    await db.matchday.update({
      where: { id: matchdayId },
      data: { playDate: toDbDay(playDate.data) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicatePlayDate();
    throw error;
  }
  return ok(null);
}
