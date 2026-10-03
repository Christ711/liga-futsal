import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { auth } from "@/server/auth/auth";
import { toAuthFailure } from "@/server/auth/auth-errors";

import { MIN_PASSWORD_LENGTH } from "./register";

/**
 * Cambio de contraseña con la actual como confirmación (RF-89, RF-90). Cierra
 * las sesiones de los demás dispositivos y mantiene la de este.
 */
export async function changePassword(
  input: { currentPassword: string; newPassword: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return fail("UNAUTHENTICATED");
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return fail("PASSWORD_TOO_SHORT", {
      fields: { newPassword: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
    });
  }

  try {
    await auth.api.changePassword({
      body: { ...input, revokeOtherSessions: true },
      headers: requestHeaders,
    });
  } catch (error) {
    const failure = toAuthFailure(error);
    // El mensaje va junto al campo de la contraseña actual.
    return !failure.ok && failure.error.code === "WRONG_CURRENT_PASSWORD"
      ? wrongCurrentPassword()
      : failure;
  }
  return ok(null);
}

export const wrongCurrentPassword = () =>
  fail("WRONG_CURRENT_PASSWORD", {
    fields: { currentPassword: "La contraseña actual es incorrecta." },
  });
