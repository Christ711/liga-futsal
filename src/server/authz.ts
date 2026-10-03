import "server-only";

import { checkLeagueEditable } from "@/domain/league-rules";
import { fail, ok, type Result } from "@/domain/result";
import type { League } from "@/generated/prisma/client";
import { db } from "@/server/db/client";

/**
 * Autoriza una operación sobre una liga (principio 3): solo su dueño la
 * recibe (RF-13). Con `mustBeInProgress`, una liga finalizada se rechaza
 * porque ya no admite cambios (RF-76). La sesión la obtiene quien llama.
 */
export async function requireOwnedLeague(
  userId: string,
  leagueId: string,
  { mustBeInProgress = false }: { mustBeInProgress?: boolean } = {},
): Promise<Result<League>> {
  const league = await db.league.findUnique({ where: { id: leagueId } });
  if (!league) return fail("NOT_FOUND");
  if (league.ownerId !== userId) return fail("FORBIDDEN");
  if (mustBeInProgress) {
    const editable = checkLeagueEditable({
      status: league.status === "FINALIZED" ? "finalized" : "in_progress",
    });
    if (!editable.ok) return editable;
  }
  return ok(league);
}
