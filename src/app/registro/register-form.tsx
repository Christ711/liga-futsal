"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";

import { registerAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);
  const error = state?.error;
  const fields = error?.fields ?? {};
  // Si el rechazo trae un mensaje por campo, se muestra en el campo y no arriba.
  const showAlert = error && Object.keys(fields).length === 0;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {showAlert ? (
        <FormAlert>
          {error.message}
          {error.code === "EMAIL_ALREADY_REGISTERED" ? (
            <>
              {" "}
              <Link href="/recuperar" className="font-medium underline">
                Recuperar contraseña
              </Link>
            </>
          ) : null}
        </FormAlert>
      ) : null}
      <FormField
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.values.email}
        error={fields.email}
      />
      <FormField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        error={fields.password}
        hint="Mínimo 8 caracteres."
      />
      <FormField
        name="inviteCode"
        label="Código de invitación"
        autoComplete="off"
        autoCapitalize="none"
        required
        defaultValue={state?.values.inviteCode}
        hint="Te lo entrega el profesor."
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
