import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  name: string;
  label: string;
  /** Mensaje de error del campo; si existe, el campo se marca como inválido. */
  error?: string;
  /** Ayuda breve que se muestra bajo el campo mientras no haya error. */
  hint?: string;
};

/** Campo de formulario con su etiqueta y su mensaje, pensado para el celular. */
export function FormField({ name, label, error, hint, ...inputProps }: FormFieldProps) {
  const messageId = `${name}-message`;
  const message = error ?? hint;
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        // 16 px evita que iOS haga zoom al enfocar; 44 px de alto para el dedo.
        className="h-11 text-base"
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message ? (
        <p
          id={messageId}
          className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
