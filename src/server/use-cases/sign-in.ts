import "server-only";

import { ok, type Result } from "@/domain/result";
import { auth } from "@/server/auth/auth";
import { toAuthFailure } from "@/server/auth/auth-errors";

/** Inicio de sesión con correo y contraseña (RF-6). El bloqueo por intentos lo aplican los hooks (RF-7). */
export async function signIn(
  input: { email: string; password: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  try {
    await auth.api.signInEmail({
      body: { email: input.email.trim().toLowerCase(), password: input.password },
      headers: requestHeaders,
    });
  } catch (error) {
    return toAuthFailure(error);
  }
  return ok(null);
}
