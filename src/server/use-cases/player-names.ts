import "server-only";

import { fail } from "@/domain/result";

/** Rechazo por nombre de jugador repetido en la liga, detectado por el índice único (RF-35; plan D2). */
export const duplicatePlayerName = () =>
  fail("DUPLICATE_NAME", { fields: { name: "Ya existe un jugador con ese nombre en la liga." } });
