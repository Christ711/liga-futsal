import "server-only";

import type { NewGoal } from "@/domain/matches";
import { fail, ok, type Result } from "@/domain/result";
import { db } from "@/server/db/client";

/**
 * Destino de un gol en el formato del dominio: el equipo y, si no es "Gol sin
 * autor", el jugador con su equipo actual. Un jugador de otra liga no existe.
 */
export async function goalTarget(
  leagueId: string,
  input: { teamId: string; scorerId: string | null },
): Promise<Result<NewGoal>> {
  if (input.scorerId === null) return ok({ teamId: input.teamId, scorer: null });
  const scorer = await db.player.findFirst({
    where: { id: input.scorerId, leagueId },
    select: { id: true, teamId: true },
  });
  if (!scorer) return fail("NOT_FOUND");
  return ok({ teamId: input.teamId, scorer });
}
