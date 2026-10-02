/** Intentos fallidos que disparan el bloqueo de un correo (RF-7). */
export const MAX_FAILED_ATTEMPTS = 5;
/** Ventana en la que se cuentan los intentos fallidos. */
export const WINDOW_MINUTES = 15;
/** Duración del bloqueo, contada desde el intento fallido que lo dispara. */
export const LOCKOUT_MINUTES = 15;

const MINUTE = 60_000;

/**
 * Decide si un correo está bloqueado (RF-7): si acumuló 5 intentos fallidos en
 * 15 minutos, todo inicio de sesión se rechaza durante los 15 minutos siguientes
 * al quinto. Devuelve el instante en que termina el bloqueo, o `null` si el
 * correo no está bloqueado en `now`. Recibe `now`; el dominio no lee el reloj.
 */
export function lockoutEndsAt(failures: readonly Date[], now: Date): Date | null {
  const times = failures.map((failure) => failure.getTime()).sort((a, b) => a - b);

  let lockedUntil: number | null = null;
  for (let index = MAX_FAILED_ATTEMPTS - 1; index < times.length; index += 1) {
    const last = times[index]!;
    const first = times[index - (MAX_FAILED_ATTEMPTS - 1)]!;
    if (last - first <= WINDOW_MINUTES * MINUTE) {
      lockedUntil = last + LOCKOUT_MINUTES * MINUTE;
    }
  }

  return lockedUntil !== null && now.getTime() < lockedUntil ? new Date(lockedUntil) : null;
}
