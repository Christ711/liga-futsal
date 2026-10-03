"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/auth/form-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteAccountAction } from "./actions";
import { leaguesWarning } from "./leagues-warning";

/** Eliminar la cuenta pide confirmación advirtiendo cuántas ligas se borran (RF-91, RF-92). */
export function DeleteAccountDialog({
  leagues,
}: {
  leagues: { inProgress: number; finalized: number };
}) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, null);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" className="h-11 w-full">
          Eliminar cuenta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            {leaguesWarning(leagues)} Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state?.ok === false ? <FormAlert>{state.error.message}</FormAlert> : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <form action={formAction}>
            <Button type="submit" variant="destructive" className="h-11 w-full" disabled={pending}>
              {pending ? "Eliminando..." : "Eliminar cuenta"}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
