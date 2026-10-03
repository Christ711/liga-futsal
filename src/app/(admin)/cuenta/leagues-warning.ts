const WHAT_ELSE = "con sus equipos, jugadores, fechas y escudos.";

/** Advertencia del diálogo de eliminar la cuenta: cuántas ligas se borran con ella (RF-91). */
export function leaguesWarning({
  inProgress,
  finalized,
}: {
  inProgress: number;
  finalized: number;
}): string {
  const total = inProgress + finalized;
  if (total === 0) return "No tienes ligas, así que solo se eliminará tu cuenta.";
  if (total === 1) {
    return `También se eliminará tu liga ${inProgress === 1 ? "en curso" : "finalizada"}, ${WHAT_ELSE}`;
  }
  const finalizedLabel = finalized === 1 ? "finalizada" : "finalizadas";
  return `También se eliminarán tus ${total} ligas (${inProgress} en curso y ${finalized} ${finalizedLabel}), ${WHAT_ELSE}`;
}
