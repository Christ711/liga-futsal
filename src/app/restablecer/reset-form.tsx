"use client";

import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";

import { resetPasswordAction } from "./actions";
import { InvalidLink } from "./invalid-link";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const error = state?.error;

  // El link venció o ya se usó mientras el formulario estaba abierto.
  if (error?.code === "RESET_LINK_INVALID") return <InvalidLink />;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormField
        name="newPassword"
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        required
        error={error?.fields?.newPassword ?? (error ? error.message : undefined)}
        hint="Mínimo 8 caracteres."
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
