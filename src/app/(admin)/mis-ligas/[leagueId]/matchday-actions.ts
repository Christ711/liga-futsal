"use server";

import { headers } from "next/headers";
import { z } from "zod";

import type { Result } from "@/domain/result";
import { deleteMatchday } from "@/server/use-cases/delete-matchday";
import { generateMatchday } from "@/server/use-cases/generate-matchday";
import { updateMatchdayDate } from "@/server/use-cases/update-matchday-date";

import type { NoticeFormState } from "../../../form-state";
import { invalidInput, refreshed, toFormState } from "./action-state";

const dateSchema = z.object({ playDate: z.string() });

export async function generateMatchdayAction(
  leagueId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = dateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await generateMatchday(leagueId, parsed.data, await headers());
  return toFormState(
    leagueId,
    result.ok ? { ok: true, data: null } : result,
    parsed.data,
    "Fecha generada.",
  );
}

export async function updateMatchdayDateAction(
  leagueId: string,
  matchdayId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = dateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await updateMatchdayDate(leagueId, matchdayId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Día cambiado.");
}

export async function deleteMatchdayAction(
  leagueId: string,
  matchdayId: string,
): Promise<Result<null>> {
  return refreshed(leagueId, await deleteMatchday(leagueId, matchdayId, await headers()));
}
