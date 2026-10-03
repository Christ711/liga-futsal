"use server";

import { headers } from "next/headers";
import { z } from "zod";

import type { Result } from "@/domain/result";
import { createTeam } from "@/server/use-cases/create-team";
import { deleteTeam } from "@/server/use-cases/delete-team";
import { removeTeamCrest } from "@/server/use-cases/remove-team-crest";
import { setTeamCrest } from "@/server/use-cases/set-team-crest";
import { updateTeam } from "@/server/use-cases/update-team";

import type { NoticeFormState } from "../../../form-state";
import { invalidInput, refreshed, toFormState } from "./action-state";

const nameSchema = z.object({ name: z.string() });

export async function createTeamAction(
  leagueId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await createTeam(leagueId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Equipo agregado.");
}

export async function updateTeamAction(
  leagueId: string,
  teamId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await updateTeam(leagueId, teamId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Nombre guardado.");
}

export async function deleteTeamAction(leagueId: string, teamId: string): Promise<Result<null>> {
  return refreshed(leagueId, await deleteTeam(leagueId, teamId, await headers()));
}

export async function setTeamCrestAction(
  leagueId: string,
  teamId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const file = formData.get("crest");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "Elige una imagen.",
        fields: { crest: "Elige una imagen." },
      },
      values: {},
    };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await setTeamCrest(leagueId, teamId, bytes, await headers());
  return toFormState(leagueId, result, {}, "Escudo guardado.");
}

export async function removeTeamCrestAction(
  leagueId: string,
  teamId: string,
): Promise<NoticeFormState> {
  const result = await removeTeamCrest(leagueId, teamId, await headers());
  return toFormState(leagueId, result, {}, "Escudo quitado.");
}
