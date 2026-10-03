"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";

import { signInAction } from "./actions";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, null);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state ? <FormAlert>{state.error.message}</FormAlert> : null}
      <FormField
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.values.email}
      />
      <FormField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
