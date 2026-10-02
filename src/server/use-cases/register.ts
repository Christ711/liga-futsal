import "server-only";

import { z } from "zod";

import { fail, ok, type Result } from "@/domain/result";
import { auth } from "@/server/auth/auth";
import { toAuthFailure } from "@/server/auth/auth-errors";

export const MIN_PASSWORD_LENGTH = 8;

const emailSchema = z.email();

/**
 * Registro de un ayudante con correo, contraseña y código de invitación; deja
 * su sesión iniciada (RF-1). El código lo valida el hook de Better Auth (RF-2).
 */
export async function register(
  input: { email: string; password: string; inviteCode: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const email = input.email.trim().toLowerCase();
  if (!emailSchema.safeParse(email).success) {
    return fail("INVALID_EMAIL", { fields: { email: "Escribe un correo válido." } });
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return fail("PASSWORD_TOO_SHORT", {
      fields: { password: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
    });
  }

  // `name` es obligatorio para Better Auth; se guarda vacío (principio 4).
  const body = { email, password: input.password, name: "", inviteCode: input.inviteCode };
  try {
    await auth.api.signUpEmail({ body, headers: requestHeaders });
  } catch (error) {
    return toAuthFailure(error);
  }
  return ok(null);
}
