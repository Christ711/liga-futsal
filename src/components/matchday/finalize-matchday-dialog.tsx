"use client";

import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Result } from "@/domain/result";

/** Advertencia de RF-101: qué queda bloqueado y cuántos partidos quedan pendientes. */
function finalizeWarning(pendingCount: number): string {
  const pending =
    pendingCount === 0
      ? "No quedan partidos pendientes."
      : pendingCount === 1
        ? "Quedará 1 partido pendiente, que podrás jugar más adelante."
        : `Quedarán ${pendingCount} partidos pendientes, que podrás jugar más adelante.`;
  return `Los partidos terminados ya no podrán modificarse. ${pending}`;
}

/**
 * Finalizar la fecha con confirmación (RF-101) y, después, preguntar si era la
 * última del semestre para ofrecer finalizar la liga (RF-106).
 */
export function FinalizeMatchdayDialog({
  leagueId,
  canFinalize,
  pendingCount,
  onFinalize,
}: {
  leagueId: string;
  /** Si es falso no se ofrece el botón, pero la pregunta posterior sigue pudiendo mostrarse. */
  canFinalize: boolean;
  pendingCount: number;
  onFinalize: () => Promise<Result<null>>;
}) {
  const [askIfLast, setAskIfLast] = useState(false);

  return (
    <>
      {canFinalize ? (
        <ConfirmDialog
          triggerLabel="Finalizar fecha"
          triggerVariant="outline"
          title="¿Finalizar la fecha?"
          description={finalizeWarning(pendingCount)}
          confirmLabel="Finalizar fecha"
          pendingLabel="Finalizando..."
          action={async () => {
            const result = await onFinalize();
            if (result.ok) setAskIfLast(true);
            return result;
          }}
        />
      ) : null}
      <Dialog open={askIfLast} onOpenChange={setAskIfLast}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Era la última fecha del semestre?</DialogTitle>
            <DialogDescription>
              Si el semestre terminó, puedes finalizar la liga para dejarla en el historial con sus
              tablas finales.
            </DialogDescription>
          </DialogHeader>
          {/* En el celular el pie invierte el orden: la opción principal queda arriba. */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 w-full sm:w-auto"
              onClick={() => setAskIfLast(false)}
            >
              No, seguir
            </Button>
            <Button asChild size="lg" className="h-11 w-full sm:w-auto">
              <Link href={`/mis-ligas/${leagueId}/ajustes#finalizar-liga`}>Finalizar la liga</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
