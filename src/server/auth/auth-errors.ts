import "server-only";

import { isAPIError } from "better-auth/api";

import { fail, type ErrorCode, type Result } from "@/domain/result";

/** Códigos de error de Better Auth y de nuestros hooks, traducidos al catálogo propio (plan D8). */
const CODES: Record<string, ErrorCode> = {
  INVALID_INVITE_CODE: "INVALID_INVITE_CODE",
  USER_ALREADY_EXISTS: "EMAIL_ALREADY_REGISTERED",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "EMAIL_ALREADY_REGISTERED",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_EMAIL_OR_PASSWORD: "INVALID_CREDENTIALS",
  TOO_MANY_LOGIN_ATTEMPTS: "TOO_MANY_LOGIN_ATTEMPTS",
  INVALID_TOKEN: "RESET_LINK_INVALID",
};

/**
 * Convierte un rechazo esperable de Better Auth en un resultado tipado
 * (ADR 010). Un error que no esté en el catálogo es inesperado y se relanza.
 */
export function toAuthFailure(error: unknown): Result<never> {
  if (isAPIError(error)) {
    const code = CODES[String(error.body?.code ?? "")];
    if (code) return fail(code);
  }
  throw error;
}
