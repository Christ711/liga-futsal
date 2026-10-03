"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages, type Result } from "@/domain/result";
import { deleteLeague } from "@/server/use-cases/delete-league";
import { updateLeague } from "@/server/use-cases/update-league";

import type { NoticeFormState } from "../../../form-state";

const schema = z.object({ name: z.string(), semester: z.string() });

export async function updateLeagueAction(
  leagueId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT },
      values: {},
    };
  }

  const result = await updateLeague(leagueId, parsed.data, await headers());
  if (!result.ok) return { ok: false, error: result.error, values: parsed.data };
  revalidatePath(`/mis-ligas/${leagueId}`);
  return { ok: true, notice: "Cambios guardados." };
}

export async function deleteLeagueAction(leagueId: string): Promise<Result<never>> {
  const result = await deleteLeague(leagueId, await headers());
  if (!result.ok) return result;
  redirect("/mis-ligas");
}
