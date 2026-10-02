import "server-only";

import { APIError, isAPIError } from "better-auth/api";

import { lockoutEndsAt, LOCKOUT_MINUTES, WINDOW_MINUTES } from "@/domain/login-lockout";
import { errorMessages } from "@/domain/result";
import { db } from "@/server/db/client";
import { now } from "@/server/time";

const MINUTE = 60_000;
/** Los fallos anteriores a esto ya no pueden influir en ningún bloqueo vigente. */
const RELEVANT_MINUTES = WINDOW_MINUTES + LOCKOUT_MINUTES;

/** Los intentos se cuentan por correo sin distinguir mayúsculas ni espacios exteriores. */
const normalize = (email: unknown) => (typeof email === "string" ? email.trim().toLowerCase() : "");

/**
 * Antes de un inicio de sesión: rechaza si el correo está bloqueado por
 * intentos fallidos (RF-7, plan D10). Cubre la Server Action y las llamadas
 * directas a `/api/auth/sign-in/email`.
 */
export async function assertNotLockedOut(body: unknown): Promise<void> {
  const email = normalize((body as { email?: unknown } | undefined)?.email);
  if (email === "") return;

  const current = now();
  const failures = await db.loginFailure.findMany({
    where: { email, createdAt: { gte: new Date(current.getTime() - RELEVANT_MINUTES * MINUTE) } },
    select: { createdAt: true },
  });
  const lockedUntil = lockoutEndsAt(
    failures.map((failure) => failure.createdAt),
    current,
  );
  if (lockedUntil) {
    throw new APIError("TOO_MANY_REQUESTS", {
      code: "TOO_MANY_LOGIN_ATTEMPTS",
      message: errorMessages.TOO_MANY_LOGIN_ATTEMPTS,
    });
  }
}

/** Después de un inicio de sesión: si falló por credenciales, registra el intento. */
export async function recordFailedSignIn(body: unknown, returned: unknown): Promise<void> {
  if (!isAPIError(returned) || returned.body?.code !== "INVALID_EMAIL_OR_PASSWORD") return;
  const email = normalize((body as { email?: unknown } | undefined)?.email);
  if (email === "") return;

  const current = now();
  await db.loginFailure.create({ data: { email, createdAt: current } });
  // Limpieza: los intentos que ya no influyen en ningún bloqueo se borran.
  await db.loginFailure.deleteMany({
    where: { email, createdAt: { lt: new Date(current.getTime() - RELEVANT_MINUTES * MINUTE) } },
  });
}
