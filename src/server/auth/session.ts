import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** Sesión del ayudante de la petición actual, o `null` si no hay. */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Sesión obligatoria para una página: sin sesión, redirige a ingresar. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/ingresar");
  return session;
}
