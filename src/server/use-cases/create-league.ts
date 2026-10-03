import "server-only";

import { validateLeagueData } from "@/domain/league-rules";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicateLeagueName } from "./league-names";

/** Crea una liga en curso con el ayudante de la sesión como único dueño (RF-15). */
export async function createLeague(
  input: { name: string; semester: string },
  requestHeaders: Headers,
): Promise<Result<{ id: string }>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const data = validateLeagueData(input);
  if (!data.ok) return data;

  try {
    const league = await db.league.create({
      data: { ownerId: user.id, ...data.data },
      select: { id: true },
    });
    return ok(league);
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateLeagueName(data.data.semester);
    throw error;
  }
}
