import "server-only";

import { auth } from "./auth";

/** Ayudante de la sesión de una petición, o `null` si no hay sesión (ADR 008, primer paso). */
export async function sessionUser(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
