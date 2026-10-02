import "server-only";

import { auth } from "@/server/auth/auth";

/** Termina la sesión de este dispositivo: borra la sesión de la base y su cookie (RF-8). */
export async function signOut(requestHeaders: Headers): Promise<void> {
  await auth.api.signOut({ headers: requestHeaders });
}
