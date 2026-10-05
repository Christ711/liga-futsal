"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Result } from "@/domain/result";

/** Advertencia de RF-73: la acción es irreversible y se descartan los pendientes. */
export function finalizeLeagueWarning(pendingCount: number): string {
  const pending =
    pendingCount === 0
      ? "No hay partidos pendientes."
      : pendingCount === 1
        ? "Se descartará 1 partido pendiente, que no contará en las tablas finales."
        : `Se descartarán ${pendingCount} partidos pendientes, que no contarán en las tablas finales.`;
  return `Esta acción no se puede deshacer. Se guardarán las tablas finales y se borrarán las fechas, los partidos, los goles y los descuentos; los equipos y sus jugadores se conservan. ${pending}`;
}

/** Finalizar la liga con confirmación (RF-73). */
export function FinalizeLeagueDialog({
  pendingCount,
  action,
}: {
  pendingCount: number;
  action: () => Promise<Result<null>>;
}) {
  return (
    <ConfirmDialog
      triggerLabel="Finalizar liga"
      title="¿Finalizar la liga?"
      description={finalizeLeagueWarning(pendingCount)}
      confirmLabel="Finalizar liga"
      pendingLabel="Finalizando..."
      action={action}
    />
  );
}
