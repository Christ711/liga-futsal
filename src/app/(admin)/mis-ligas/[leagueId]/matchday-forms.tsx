"use client";

import { useActionState, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Result } from "@/domain/result";

import type { NoticeFormState } from "../../../form-state";
import { matchdayDeletionWarning } from "./matchday-deletion-warning";

type FormAction = (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;

/** Campo de día de juego con el selector de fecha del sistema. */
function PlayDateField({
  id,
  state,
  defaultValue,
}: {
  id: string;
  state: NoticeFormState;
  defaultValue: string;
}) {
  const error = state?.ok === false ? state.error : undefined;
  return (
    <>
      <FormField
        id={id}
        name="playDate"
        label="Día de juego"
        type="date"
        required
        defaultValue={state?.ok === false ? state.values.playDate : defaultValue}
        error={error?.fields?.playDate}
      />
      {error && !error.fields ? <FormAlert>{error.message}</FormAlert> : null}
    </>
  );
}

/**
 * Generar una fecha: propone el día de hoy y deja cambiarlo antes de crearla
 * (RF-97). Si no se puede generar, el botón queda desactivado y la sección
 * explica por qué (RF-41, RF-100).
 */
export function GenerateMatchdayDialog({
  action,
  today,
  disabled,
}: {
  action: FormAction;
  today: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: NoticeFormState, formData: FormData) => {
      const result = await action(previous, formData);
      // Al crearse la fecha, el diálogo se cierra; la lista ya viene actualizada.
      if (result?.ok) setOpen(false);
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-11 w-full" disabled={disabled}>
          Generar fecha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar fecha</DialogTitle>
          <DialogDescription>
            Se crea un partido por cada par de equipos, todos pendientes, en un orden con la menor
            cantidad posible de partidos seguidos de un mismo equipo.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4" noValidate>
          <PlayDateField id="new-matchday-date" state={state} defaultValue={today} />
          <DialogFooter>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
              {pending ? "Generando..." : "Generar fecha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Cambiar el día de una fecha y eliminarla (RF-50, RF-51, RF-98). */
export function MatchdayEditor({
  matchday,
  updateAction,
  deleteAction,
}: {
  matchday: { id: string; number: number; playDate: string; finishedCount: number };
  updateAction: FormAction;
  deleteAction: () => Promise<Result<null>>;
}) {
  const [state, formAction, pending] = useActionState(updateAction, null);

  return (
    <div className="grid gap-5">
      <form action={formAction} className="grid gap-3" noValidate>
        <PlayDateField
          id={`matchday-${matchday.id}-date`}
          state={state}
          defaultValue={matchday.playDate}
        />
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-11 w-full"
          disabled={pending}
        >
          {pending ? "Guardando..." : "Cambiar día"}
        </Button>
      </form>
      <ConfirmDialog
        triggerLabel="Eliminar fecha"
        triggerVariant="outline"
        title={`¿Eliminar la fecha ${matchday.number}?`}
        description={matchdayDeletionWarning(matchday.finishedCount)}
        confirmLabel="Eliminar fecha"
        pendingLabel="Eliminando..."
        action={deleteAction}
      />
    </div>
  );
}
