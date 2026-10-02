import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { auth } from "@/server/auth/auth";
import { toAuthFailure } from "@/server/auth/auth-errors";

import { MIN_PASSWORD_LENGTH } from "./register";

/**
 * Define una contraseña nueva con el token del link de recuperación (RF-11).
 * Better Auth invalida el token al usarlo y cierra todas las sesiones (RF-86).
 */
export async function resetPassword(
  input: { token: string; newPassword: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  if (input.token === "") return fail("RESET_LINK_INVALID");
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return fail("PASSWORD_TOO_SHORT", {
      fields: { newPassword: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
    });
  }
  try {
    await auth.api.resetPassword({
      body: { token: input.token, newPassword: input.newPassword },
      headers: requestHeaders,
    });
  } catch (error) {
    return toAuthFailure(error);
  }
  return ok(null);
}
