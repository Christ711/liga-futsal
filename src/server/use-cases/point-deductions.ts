import "server-only";

import { validateDeduction } from "@/domain/deductions";
import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedDeduction, requireOwnedTeam } from "@/server/authz";
import { db } from "@/server/db/client";

type DeductionInput = { points: string; reason: string };

/** Aplica un descuento de puntos a un equipo; puede tener varios (RF-67, RF-69). */
export async function createPointDeduction(
  leagueId: string,
  input: DeductionInput & { teamId: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedTeam(user.id, leagueId, input.teamId, {
    mustBeInProgress: true,
  });
  if (!owned.ok) return owned;
  const deduction = validateDeduction(input);
  if (!deduction.ok) return deduction;

  await db.pointDeduction.create({ data: { teamId: input.teamId, ...deduction.data } });
  return ok(null);
}

/** Edita los puntos y el motivo de un descuento (RF-68). */
export async function updatePointDeduction(
  leagueId: string,
  deductionId: string,
  input: DeductionInput,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedDeduction(user.id, leagueId, deductionId, {
    mustBeInProgress: true,
  });
  if (!owned.ok) return owned;
  const deduction = validateDeduction(input);
  if (!deduction.ok) return deduction;

  await db.pointDeduction.update({ where: { id: deductionId }, data: deduction.data });
  return ok(null);
}

/** Elimina un descuento (RF-68). */
export async function deletePointDeduction(
  leagueId: string,
  deductionId: string,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedDeduction(user.id, leagueId, deductionId, {
    mustBeInProgress: true,
  });
  if (!owned.ok) return owned;

  await db.pointDeduction.delete({ where: { id: deductionId } });
  return ok(null);
}
