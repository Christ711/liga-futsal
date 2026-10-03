import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** Sesión del ayudante de la petición actual, o `null` si no hay. */
export async function getSession(): Promise<Session | null> {
  // Las cookies salen de `cookies()` y no de la cabecera original: si una
  // Server Action cambió la sesión (por ejemplo, al cambiar la contraseña),
  // el render que sigue en la misma petición ya debe ver la cookie nueva.
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  return auth.api.getSession({ headers: requestHeaders });
}

/** Sesión obligatoria para una página: sin sesión, redirige a ingresar. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/ingresar");
  return session;
}
