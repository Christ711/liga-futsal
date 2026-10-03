"use server";

import { headers } from "next/headers";
import { z } from "zod";

import {
  createPointDeduction,
  deletePointDeduction,
  updatePointDeduction,
} from "@/server/use-cases/point-deductions";

import type { NoticeFormState } from "../../../form-state";
import { invalidInput, toFormState } from "./action-state";

const deductionSchema = z.object({ points: z.string(), reason: z.string() });

export async function createDeductionAction(
  leagueId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = deductionSchema
    .extend({ teamId: z.string() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await createPointDeduction(leagueId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Descuento aplicado.");
}

export async function updateDeductionAction(
  leagueId: string,
  deductionId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = deductionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await updatePointDeduction(leagueId, deductionId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Descuento guardado.");
}

export async function deleteDeductionAction(
  leagueId: string,
  deductionId: string,
): Promise<NoticeFormState> {
  const result = await deletePointDeduction(leagueId, deductionId, await headers());
  return toFormState(leagueId, result, {}, "Descuento eliminado.");
}
