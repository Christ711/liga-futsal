"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";

import type { NoticeFormState } from "../../../form-state";

type FormAction = (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;

/** Campos de puntos y motivo, compartidos por aplicar y editar un descuento (RF-67, RF-68). */
function DeductionFields({
  idPrefix,
  state,
  defaults,
}: {
  idPrefix: string;
  state: NoticeFormState;
  defaults?: { points: string; reason: string };
}) {
  const error = state?.ok === false ? state.error : undefined;
  const values = state?.ok === false ? state.values : defaults;
  return (
    <>
      <FormField
        id={`${idPrefix}-points`}
        name="points"
        label="Puntos"
        inputMode="numeric"
        autoComplete="off"
        required
        defaultValue={values?.points}
        error={error?.fields?.points}
        hint="Cantidad entera que se resta, por ejemplo 3."
      />
      <FormField
        id={`${idPrefix}-reason`}
        name="reason"
        label="Motivo"
        autoComplete="off"
        required
        defaultValue={values?.reason}
        error={error?.fields?.reason}
        hint="Se muestra en la tabla. Hasta 100 caracteres."
      />
      {error && !error.fields ? <FormAlert>{error.message}</FormAlert> : null}
    </>
  );
}

export function AddDeductionForm({
  action,
  teams,
}: {
  action: FormAction;
  teams: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} aria-label="Nuevo descuento" className="grid gap-3" noValidate>
      <SelectField
        id="new-deduction-team"
        name="teamId"
        label="Equipo"
        options={teams.map((team) => ({ value: team.id, label: team.name }))}
        defaultValue={state?.ok === false ? state.values.teamId : undefined}
      />
      <DeductionFields idPrefix="new-deduction" state={state} />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Aplicando..." : "Aplicar descuento"}
      </Button>
    </form>
  );
}

export function DeductionEditor({
  deduction,
  updateAction,
  deleteAction,
}: {
  deduction: { id: string; points: number; reason: string };
  updateAction: FormAction;
  deleteAction: () => Promise<NoticeFormState>;
}) {
  const [state, formAction, pending] = useActionState(updateAction, null);
  const [deleteState, remove, removing] = useActionState(deleteAction, null);

  return (
    <div className="grid gap-3">
      <form action={formAction} className="grid gap-3" noValidate>
        <DeductionFields
          idPrefix={`deduction-${deduction.id}`}
          state={state}
          defaults={{ points: String(deduction.points), reason: deduction.reason }}
        />
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-11 w-full"
          disabled={pending}
        >
          {pending ? "Guardando..." : "Guardar descuento"}
        </Button>
      </form>
      <form action={remove} className="grid gap-3">
        {deleteState?.ok === false ? <FormAlert>{deleteState.error.message}</FormAlert> : null}
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-11 w-full text-destructive"
          disabled={removing}
        >
          {removing ? "Eliminando..." : "Eliminar descuento"}
        </Button>
      </form>
    </div>
  );
}
