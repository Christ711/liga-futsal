"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { FormNotice } from "@/components/auth/form-notice";
import { Button } from "@/components/ui/button";

import { changeEmailAction } from "./actions";

export function ChangeEmailForm() {
  const [state, formAction, pending] = useActionState(changeEmailAction, null);
  const error = state?.ok === false ? state.error : undefined;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.ok ? <FormNotice>{state.notice}</FormNotice> : null}
      {error && !error.fields ? <FormAlert>{error.message}</FormAlert> : null}
      <FormField
        id="email-new"
        name="email"
        label="Correo nuevo"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.ok === false ? state.values.email : undefined}
        error={error?.fields?.email}
      />
      <FormField
        id="email-password"
        name="currentPassword"
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        required
        error={error?.fields?.currentPassword}
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Guardando..." : "Cambiar correo"}
      </Button>
    </form>
  );
}
