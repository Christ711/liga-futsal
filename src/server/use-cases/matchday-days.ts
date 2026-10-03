import "server-only";

import { fail } from "@/domain/result";

/** Rechazo por día de juego repetido en la liga, detectado por el índice único (RF-99). */
export const duplicatePlayDate = () =>
  fail("DUPLICATE_PLAY_DATE", { fields: { playDate: "Ya hay una fecha de la liga ese día." } });
