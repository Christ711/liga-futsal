/**
 * Numera las fechas de una liga desde 1 según el orden cronológico de su día de
 * juego (RF-43). El número no se guarda: se calcula cada vez, así que borrar una
 * fecha o cambiar su día renumera sola (plan D3).
 */
export function numberMatchdays<T extends { playDate: string }>(
  matchdays: readonly T[],
): (T & { number: number })[] {
  // Los días son `YYYY-MM-DD`: el orden alfabético coincide con el cronológico.
  const sorted = [...matchdays].sort((a, b) => a.playDate.localeCompare(b.playDate));
  return sorted.map((matchday, index) => {
    const previous = sorted[index - 1];
    if (previous && previous.playDate === matchday.playDate) {
      throw new Error(
        `Dos fechas de la liga comparten el mismo día de juego: ${matchday.playDate}.`,
      );
    }
    return { ...matchday, number: index + 1 };
  });
}

export type MatchdayStatus = "open" | "incomplete" | "finalized";

/**
 * Estado de una fecha, derivado y no guardado (plan D3):
 * - abierta mientras nunca se haya finalizado (RF-48);
 * - incompleta si se finalizó y le quedan partidos pendientes (RF-104);
 * - finalizada si se finalizó y no le queda ninguno (RF-105).
 */
export function matchdayStatus(matchday: {
  finalized: boolean;
  matches: readonly { status: "pending" | "finished" }[];
}): { status: MatchdayStatus; pendingCount: number } {
  const pendingCount = matchday.matches.filter((match) => match.status === "pending").length;
  if (!matchday.finalized) return { status: "open", pendingCount };
  return { status: pendingCount > 0 ? "incomplete" : "finalized", pendingCount };
}

/**
 * Partidos que se bloquean al finalizar una fecha: los terminados que aún no lo
 * están (RF-102). Los pendientes quedan libres para jugarse otro día (RF-49).
 */
export function matchesToLock(
  matches: readonly { id: string; status: "pending" | "finished"; locked: boolean }[],
): string[] {
  return matches
    .filter((match) => match.status === "finished" && !match.locked)
    .map((match) => match.id);
}
