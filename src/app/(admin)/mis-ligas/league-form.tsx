"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { FormNotice } from "@/components/auth/form-notice";
import { Button } from "@/components/ui/button";
import { NAME_MAX_LENGTH } from "@/domain/names";

import type { NoticeFormState } from "../../form-state";

/** Formulario de nombre y semestre de una liga, para crearla o editarla (RF-15 a RF-20). */
export function LeagueForm({
  action,
  defaultValues,
  submitLabel,
  pendingLabel,
  idPrefix = "league",
}: {
  action: (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;
  defaultValues: { name: string; semester: string };
  submitLabel: string;
  pendingLabel: string;
  idPrefix?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const error = state?.ok === false ? state.error : undefined;
  const values = state?.ok === false ? state.values : defaultValues;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.ok ? <FormNotice>{state.notice}</FormNotice> : null}
      {error && !error.fields ? <FormAlert>{error.message}</FormAlert> : null}
      <FormField
        id={`${idPrefix}-name`}
        name="name"
        label="Nombre"
        autoComplete="off"
        required
        maxLength={NAME_MAX_LENGTH.league * 2}
        defaultValue={values.name}
        error={error?.fields?.name}
        hint={`Hasta ${NAME_MAX_LENGTH.league} caracteres. No se puede repetir en el mismo semestre.`}
      />
      <FormField
        id={`${idPrefix}-semester`}
        name="semester"
        label="Semestre"
        autoComplete="off"
        required
        defaultValue={values.semester}
        error={error?.fields?.semester}
        hint="Formato AAAA-1 o AAAA-2, por ejemplo 2026-2."
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
