import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";

/**
 * Crea una cuenta real con Better Auth y devuelve su usuario y las cabeceras
 * de una petición con su sesión, para llamar a los casos de uso.
 */
export async function signedUpAccount() {
  const email = `ayudante-${crypto.randomUUID()}@example.com`;
  const body = {
    email,
    password: "contraseña-segura",
    name: "",
    inviteCode: process.env.INVITE_CODE!,
  };
  const response = await auth.api.signUpEmail({ body, asResponse: true });
  const cookie = response.headers.get("set-cookie")!.split(";")[0]!;
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  return { user, headers: new Headers({ cookie }) };
}

/** Correo de la cuenta administradora de los tests de integración (ver vitest.config.ts). */
export const ADMIN_EMAIL = "admin-de-pruebas@example.com";

/**
 * Sesión de la cuenta administradora. La crea la primera vez; después inicia
 * sesión, porque el correo es fijo y la base dura toda la ejecución.
 */
export async function adminAccount() {
  const credentials = { email: ADMIN_EMAIL, password: "contraseña-de-admin" };
  let response: Response;
  if (await db.user.findUnique({ where: { email: ADMIN_EMAIL } })) {
    response = await auth.api.signInEmail({ body: credentials, asResponse: true });
  } else {
    const body = { ...credentials, name: "", inviteCode: process.env.INVITE_CODE! };
    response = await auth.api.signUpEmail({ body, asResponse: true });
  }
  const cookie = response.headers.get("set-cookie")!.split(";")[0]!;
  const user = await db.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
  return { user, headers: new Headers({ cookie }) };
}
