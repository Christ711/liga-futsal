import "server-only";

import { validateName } from "@/domain/names";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedPlayer } from "@/server/authz";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { duplicatePlayerName } from "./player-names";

/** Renombra un jugador; sus goles siguen siendo suyos (RF-34, RF-35, RF-36). */
export async function updatePlayer(
  leagueId: string,
  playerId: string,
  input: { name: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedPlayer(user.id, leagueId, playerId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const name = validateName("player", input.name);
  if (!name.ok) return name;

  try {
    await db.player.update({ where: { id: playerId }, data: name.data });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicatePlayerName();
    throw error;
  }
  return ok(null);
}
