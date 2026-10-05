import "server-only";

import { getEnv } from "@/server/env";

/**
 * Una cuenta es administradora solo si su correo está en `ADMIN_EMAILS`
 * (RF-112, plan D21). La lista se lee en cada consulta: quitar un correo corta
 * el acceso en la siguiente petición.
 */
export function isAdminEmail(email: string, admins: readonly string[] = getEnv().ADMIN_EMAILS) {
  return admins.includes(email.trim().toLowerCase());
}
