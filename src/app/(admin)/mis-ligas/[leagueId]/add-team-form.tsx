"use client";

import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";

import type { NoticeFormState } from "../../../form-state";

/** Agregar un equipo por nombre; el escudo se sube después desde el equipo (RF-23). */
export function AddTeamForm({
  action,
}: {
  action: (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const error = state?.ok === false ? state.error : undefined;

  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <FormField
        id="new-team-name"
        name="name"
        label="Nombre del equipo"
        autoComplete="off"
        required
        defaultValue={state?.ok === false ? state.values.name : undefined}
        error={error?.fields?.name ?? (error ? error.message : undefined)}
        hint="Hasta 30 caracteres."
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Agregando..." : "Agregar equipo"}
      </Button>
    </form>
  );
}
