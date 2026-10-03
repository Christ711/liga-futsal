"use server";

import { headers } from "next/headers";
import { z } from "zod";

import type { Result } from "@/domain/result";
import { createPlayer } from "@/server/use-cases/create-player";
import { deletePlayer } from "@/server/use-cases/delete-player";
import { transferPlayer } from "@/server/use-cases/transfer-player";
import { updatePlayer } from "@/server/use-cases/update-player";

import type { NoticeFormState } from "../../../form-state";
import { invalidInput, refreshed, toFormState } from "./action-state";

const nameSchema = z.object({ name: z.string() });
const transferSchema = z.object({ teamId: z.string() });

export async function createPlayerAction(
  leagueId: string,
  teamId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await createPlayer(leagueId, teamId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Jugador agregado.");
}

export async function updatePlayerAction(
  leagueId: string,
  playerId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await updatePlayer(leagueId, playerId, parsed.data, await headers());
  return toFormState(leagueId, result, parsed.data, "Nombre guardado.");
}

export async function transferPlayerAction(
  leagueId: string,
  playerId: string,
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();
  const result = await transferPlayer(leagueId, playerId, parsed.data, await headers());
  return toFormState(leagueId, result, {}, "Jugador traspasado.");
}

export async function deletePlayerAction(
  leagueId: string,
  playerId: string,
): Promise<Result<null>> {
  return refreshed(leagueId, await deletePlayer(leagueId, playerId, await headers()));
}
