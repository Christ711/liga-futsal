import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";

/**
 * Elimina la cuenta con todas sus ligas, sus datos y sus escudos, y todas sus
 * sesiones (RF-92; plan D12). El borrado en cascada lo hace la base.
 */
export async function deleteAccount(requestHeaders: Headers): Promise<Result<null>> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return fail("UNAUTHENTICATED");
  const { id, email } = session.user;

  await db.$transaction([
    // Tampoco quedan rastros del correo ni links de recuperación pendientes (principio 4).
    db.loginFailure.deleteMany({ where: { email } }),
    db.verification.deleteMany({
      where: { identifier: { startsWith: "reset-password:" }, value: id },
    }),
    db.user.delete({ where: { id } }),
  ]);
  // La sesión ya no existe en la base; esto borra la cookie con los mismos
  // atributos con que Better Auth la creó.
  await auth.api.signOut({ headers: requestHeaders });
  return ok(null);
}
