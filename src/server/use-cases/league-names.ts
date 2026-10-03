import "server-only";

import { fail } from "@/domain/result";

/** Rechazo por nombre repetido en el semestre, detectado por el índice único (RF-18; plan D2). */
export const duplicateLeagueName = (semester: string) =>
  fail("DUPLICATE_NAME", {
    fields: { name: `Ya existe una liga con ese nombre en el semestre ${semester}.` },
  });
