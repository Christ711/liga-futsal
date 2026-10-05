"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Copia el link público de la liga para compartirlo con los alumnos. */
export function CopyLinkButton({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      // Sin permiso para el portapapeles, el link sigue a la vista para copiarlo a mano.
      setState("failed");
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" size="lg" className="h-11 w-full" onClick={copy}>
        {state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
        Copiar link
      </Button>
      <p role="status" className="text-sm text-muted-foreground empty:hidden">
        {state === "copied"
          ? "Link copiado"
          : state === "failed"
            ? "No se pudo copiar; mantén presionado el link para copiarlo."
            : ""}
      </p>
    </div>
  );
}
