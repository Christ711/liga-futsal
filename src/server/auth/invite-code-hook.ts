import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { APIError } from "better-auth/api";

import { errorMessages } from "@/domain/result";
import { getEnv } from "@/server/env";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Compara en tiempo constante, para que el tiempo de respuesta no revele el código. */
function matchesInviteCode(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  return timingSafeEqual(digest(candidate), digest(getEnv().INVITE_CODE));
}

/**
 * Rechaza el registro si el código de invitación no coincide con el vigente
 * (RF-2). Corre como hook previo de Better Auth, así que cubre tanto la Server
 * Action de registro como una llamada directa a `/api/auth/sign-up/email` (plan D9).
 */
export function assertInviteCode(body: unknown): void {
  const inviteCode = (body as { inviteCode?: unknown } | undefined)?.inviteCode;
  if (!matchesInviteCode(inviteCode)) {
    throw new APIError("FORBIDDEN", {
      code: "INVALID_INVITE_CODE",
      message: errorMessages.INVALID_INVITE_CODE,
    });
  }
}
