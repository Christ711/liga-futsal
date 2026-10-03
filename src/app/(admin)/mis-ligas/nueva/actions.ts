"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages } from "@/domain/result";
import { createLeague } from "@/server/use-cases/create-league";

import type { NoticeFormState } from "../../../form-state";

const schema = z.object({ name: z.string(), semester: z.string() });

export async function createLeagueAction(
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

  const result = await createLeague(parsed.data, await headers());
  if (!result.ok) return { ok: false, error: result.error, values: parsed.data };
  redirect(`/mis-ligas/${result.data.id}`);
}
