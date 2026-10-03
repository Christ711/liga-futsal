import "server-only";

import { fail } from "@/domain/result";

/** Rechazo por nombre de equipo repetido en la liga, detectado por el índice único (RF-26; plan D2). */
export const duplicateTeamName = () =>
  fail("DUPLICATE_NAME", { fields: { name: "Ya existe un equipo con ese nombre en la liga." } });
