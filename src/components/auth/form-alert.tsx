import type { ReactNode } from "react";

/** Mensaje de rechazo de un formulario; `role="alert"` lo anuncia a los lectores de pantalla. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}
