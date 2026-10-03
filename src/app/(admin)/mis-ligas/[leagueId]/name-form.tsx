"use client";

import { useActionState } from "react";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";

import type { NoticeFormState } from "../../../form-state";

/**
 * Formulario de un solo nombre, para agregar o renombrar equipos y jugadores.
 * Si se rechaza, conserva lo escrito y muestra el motivo junto al campo.
 */
export function NameForm({
  action,
  id,
  label,
  submitLabel,
  pendingLabel,
  defaultValue,
  hint,
  primary = false,
}: {
  action: (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;
  id: string;
  label: string;
  submitLabel: string;
  pendingLabel: string;
  defaultValue?: string;
  hint?: string;
  /** El botón principal de la sección va relleno; los de edición, con borde. */
  primary?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const error = state?.ok === false ? state.error : undefined;

  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <FormField
        id={id}
        name="name"
        label={label}
        autoComplete="off"
        required
        defaultValue={state?.ok === false ? state.values.name : defaultValue}
        error={error?.fields?.name ?? (error ? error.message : undefined)}
        hint={hint}
      />
      <Button
        type="submit"
        variant={primary ? "default" : "outline"}
        size="lg"
        className="h-11 w-full"
        disabled={pending}
      >
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
