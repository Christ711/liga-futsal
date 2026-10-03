"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";

import { deleteAccountAction } from "./actions";
import { leaguesWarning } from "./leagues-warning";

/** Eliminar la cuenta pide confirmación advirtiendo cuántas ligas se borran (RF-91, RF-92). */
export function DeleteAccountDialog({
  leagues,
}: {
  leagues: { inProgress: number; finalized: number };
}) {
  return (
    <ConfirmDialog
      triggerLabel="Eliminar cuenta"
      title="¿Eliminar tu cuenta?"
      description={`${leaguesWarning(leagues)} Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar cuenta"
      pendingLabel="Eliminando..."
      action={deleteAccountAction}
    />
  );
}
