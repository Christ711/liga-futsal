import type { ReactNode } from "react";

/** Aviso informativo de un formulario; `role="status"` lo anuncia sin interrumpir. */
export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded-md border bg-muted px-3 py-2 text-sm">
      {children}
    </div>
  );
}
