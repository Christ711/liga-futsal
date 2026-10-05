import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatch } from "@/server/authz";
import { db } from "@/server/db/client";

/**
 * Mueve un partido una posición dentro de su fecha, intercambiándolo con el
 * vecino (RF-46; plan D17). En un extremo de la lista no cambia nada.
 */
export async function moveMatch(
  leagueId: string,
  matchId: string,
  direction: "up" | "down",
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedMatch(user.id, leagueId, matchId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const { matchdayId, position } = owned.data.match;

  await db.$transaction(async (tx) => {
    const neighbor = await tx.match.findFirst({
      where:
        direction === "up"
          ? { matchdayId, position: { lt: position } }
          : { matchdayId, position: { gt: position } },
      orderBy: { position: direction === "up" ? "desc" : "asc" },
      select: { id: true, position: true },
    });
    if (!neighbor) return;
    await tx.match.update({ where: { id: matchId }, data: { position: neighbor.position } });
    await tx.match.update({ where: { id: neighbor.id }, data: { position } });
  });
  return ok(null);
}
