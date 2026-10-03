"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { FormNotice } from "@/components/auth/form-notice";
import { Button } from "@/components/ui/button";

import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);
  const error = state?.ok === false ? state.error : undefined;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.ok ? <FormNotice>{state.notice}</FormNotice> : null}
      {error && !error.fields ? <FormAlert>{error.message}</FormAlert> : null}
      <FormField
        id="password-current"
        name="currentPassword"
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        required
        error={error?.fields?.currentPassword}
      />
      <FormField
        id="password-new"
        name="newPassword"
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        required
        error={error?.fields?.newPassword}
        hint="Mínimo 8 caracteres."
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
