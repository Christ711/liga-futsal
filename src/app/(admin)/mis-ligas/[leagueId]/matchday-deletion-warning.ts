/** Advertencia del diálogo de eliminar una fecha: cuántos partidos terminados se pierden (RF-51). */
export function matchdayDeletionWarning(finishedCount: number): string {
  const lost =
    finishedCount === 0
      ? "No tiene partidos terminados."
      : finishedCount === 1
        ? "Se perderá 1 partido terminado con sus goles, y las tablas se recalcularán."
        : `Se perderán ${finishedCount} partidos terminados con sus goles, y las tablas se recalcularán.`;
  return `${lost} Esta acción no se puede deshacer.`;
}
