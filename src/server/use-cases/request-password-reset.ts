import "server-only";

import { isAPIError } from "better-auth/api";

import { auth } from "@/server/auth/auth";

/** Página a la que Better Auth redirige después de validar el link del correo. */
export const RESET_PAGE = "/restablecer";

/**
 * Solicitud de recuperación de contraseña. Nunca informa si el correo tiene
 * cuenta (RF-9): si existe, se le envía el link (RF-10); si no, no pasa nada.
 */
export async function requestPasswordReset(email: string, requestHeaders: Headers): Promise<void> {
  try {
    await auth.api.requestPasswordReset({
      body: { email: email.trim().toLowerCase(), redirectTo: RESET_PAGE },
      headers: requestHeaders,
    });
  } catch (error) {
    // Un rechazo de Better Auth (por ejemplo, un correo mal escrito) tampoco se revela.
    if (!isAPIError(error)) throw error;
  }
}
