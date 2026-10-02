"use client";

import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormNotice } from "@/components/auth/form-notice";
import { Button } from "@/components/ui/button";

import { requestPasswordResetAction } from "./actions";

export function RecoverForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);

  if (state?.sent) {
    return (
      <FormNotice>
        <p className="font-medium">Si el correo existe, te enviamos un link</p>
        <p className="mt-1 text-muted-foreground">
          Revisa tu bandeja de entrada y la carpeta de spam. El link vence en 1 hora.
        </p>
      </FormNotice>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <FormField
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
