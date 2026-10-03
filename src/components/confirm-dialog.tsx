"use client";

import { useActionState, useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { AppError, Result } from "@/domain/result";
import { cn } from "@/lib/utils";

/**
 * Botón que pide confirmación antes de una acción destructiva. Si la acción
 * se rechaza, el diálogo queda abierto con el motivo; si funciona y no
 * redirige, se cierra.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerVariant = "destructive",
  title,
  description,
  confirmLabel,
  pendingLabel,
  action,
}: {
  triggerLabel: string;
  /** Las acciones menores (eliminar un jugador) usan un botón menos llamativo. */
  triggerVariant?: "destructive" | "outline";
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  action: () => Promise<Result<unknown>>;
}) {
  const [open, setOpen] = useState(false);
  const [error, confirm, pending] = useActionState(async (): Promise<AppError | null> => {
    const result = await action();
    if (!result.ok) return result.error;
    setOpen(false);
    return null;
  }, null);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="lg"
          className={cn("h-11 w-full", triggerVariant === "outline" && "text-destructive")}
        >
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <FormAlert>{error.message}</FormAlert> : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <form action={confirm}>
            <Button type="submit" variant="destructive" className="h-11 w-full" disabled={pending}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
