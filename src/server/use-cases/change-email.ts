import "server-only";

import { z } from "zod";

import { fail, ok, type Result } from "@/domain/result";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";

import { wrongCurrentPassword } from "./change-password";

const emailSchema = z.email();

/**
 * Cambio de correo con la contraseña actual como confirmación y sin enviar
 * mensajes de verificación (RF-87, RF-88, RF-90; plan D12).
 */
export async function changeEmail(
  input: { email: string; currentPassword: string },
  requestHeaders: Headers,
): Promise<Result<null>> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return fail("UNAUTHENTICATED");
  const email = input.email.trim().toLowerCase();
  if (!emailSchema.safeParse(email).success) {
    return fail("INVALID_EMAIL", { fields: { email: "Escribe un correo válido." } });
  }

  // La contraseña se verifica antes que el correo, para no revelar a quien no
  // la conoce si un correo tiene cuenta.
  const credential = await db.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { password: true },
  });
  const { password } = await auth.$context;
  const valid =
    credential?.password != null &&
    (await password.verify({ hash: credential.password, password: input.currentPassword }));
  if (!valid) return wrongCurrentPassword();

  try {
    await db.user.update({ where: { id: session.user.id }, data: { email } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("EMAIL_ALREADY_REGISTERED", {
        fields: { email: "Ya existe una cuenta con ese correo." },
      });
    }
    throw error;
  }
  return ok(null);
}
