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
