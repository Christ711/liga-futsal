import "server-only";

import { getEnv } from "@/server/env";

/**
 * Una cuenta es administradora solo si su correo está en `ADMIN_EMAILS`
 * (RF-112, plan D21). No crea cuentas: marca como administradora a una cuenta
 * que ya existe o que se cree después con ese correo. La lista se valida al
 * arrancar (`getEnv`), así que un cambio se aplica en el siguiente deploy.
 */
export function isAdminEmail(email: string, admins: readonly string[] = getEnv().ADMIN_EMAILS) {
  return admins.includes(email.trim().toLowerCase());
}
