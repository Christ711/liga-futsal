import "server-only";

import { revalidatePath } from "next/cache";

import { errorMessages, type Result } from "@/domain/result";

import type { NoticeFormState } from "../../../form-state";

/** Estado de un formulario cuyo contenido no pasó la validación de forma. */
export const invalidInput = (): NoticeFormState => ({
  ok: false,
  error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT },
  values: {},
});

/**
 * Convierte el resultado de un caso de uso en el estado del formulario y, si
 * funcionó, vuelve a renderizar la administración de la liga con todas sus
 * subpáginas (plan D22).
 */
export function toFormState(
  leagueId: string,
  result: Result<null>,
  values: Record<string, string>,
  notice: string,
): NoticeFormState {
  if (!result.ok) return { ok: false, error: result.error, values };
  revalidatePath(`/mis-ligas/${leagueId}`, "layout");
  return { ok: true, notice };
}

/** Resultado de una acción confirmada en un diálogo; si funcionó, refresca la liga. */
export function refreshed(leagueId: string, result: Result<null>): Result<null> {
  if (result.ok) revalidatePath(`/mis-ligas/${leagueId}`, "layout");
  return result;
}
