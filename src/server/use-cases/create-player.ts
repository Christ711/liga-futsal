import "server-only";

import { validateName } from "@/domain/names";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedTeam } from "@/server/authz";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicatePlayerName } from "./player-names";

/** Agrega un jugador a un equipo con solo su nombre a mostrar (RF-33, RF-35, RF-36). */
export async function createPlayer(
  leagueId: string,
  teamId: string,
  input: { name: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedTeam(user.id, leagueId, teamId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const name = validateName("player", input.name);
  if (!name.ok) return name;

  try {
    await db.player.create({ data: { leagueId, teamId, ...name.data } });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicatePlayerName();
    throw error;
  }
  return ok(null);
}
