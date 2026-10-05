"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { errorMessages, type Result } from "@/domain/result";
import { addGoal } from "@/server/use-cases/add-goal";
import { finalizeMatchday } from "@/server/use-cases/finalize-matchday";
import { finishMatch } from "@/server/use-cases/finish-match";
import { reassignGoal } from "@/server/use-cases/reassign-goal";
import { removeGoal } from "@/server/use-cases/remove-goal";
import { moveMatch } from "@/server/use-cases/reorder-matches";
import { revertMatch } from "@/server/use-cases/revert-match";

/**
 * Acciones de la vista de la fecha. Las llama `useMutation` (ADR 011): no
 * refrescan la página, porque la caché de TanStack Query vuelve a leer la
 * ruta GET al terminar.
 */

const id = z.string().min(1);
const target = z.object({ teamId: id, scorerId: id.nullable() });

const invalid = (): Result<never> => ({
  ok: false,
  error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT },
});

export async function addGoalAction(leagueId: string, input: unknown): Promise<Result<null>> {
  const parsed = target.extend({ matchId: id }).safeParse(input);
  if (!parsed.success) return invalid();
  return addGoal(leagueId, parsed.data, await headers());
}

export async function removeGoalAction(leagueId: string, goalId: string): Promise<Result<null>> {
  return removeGoal(leagueId, goalId, await headers());
}

export async function reassignGoalAction(leagueId: string, input: unknown): Promise<Result<null>> {
  const parsed = target.extend({ goalId: id }).safeParse(input);
  if (!parsed.success) return invalid();
  const { goalId, ...goal } = parsed.data;
  return reassignGoal(leagueId, goalId, goal, await headers());
}

export async function finishMatchAction(leagueId: string, matchId: string): Promise<Result<null>> {
  return finishMatch(leagueId, matchId, await headers());
}

export async function revertMatchAction(leagueId: string, matchId: string): Promise<Result<null>> {
  return revertMatch(leagueId, matchId, await headers());
}

export async function moveMatchAction(leagueId: string, input: unknown): Promise<Result<null>> {
  const parsed = z.object({ matchId: id, direction: z.enum(["up", "down"]) }).safeParse(input);
  if (!parsed.success) return invalid();
  return moveMatch(leagueId, parsed.data.matchId, parsed.data.direction, await headers());
}

export async function finalizeMatchdayAction(
  leagueId: string,
  matchdayId: string,
): Promise<Result<null>> {
  return finalizeMatchday(leagueId, matchdayId, await headers());
}
