"use client";

import { useActionState, useState } from "react";

import { FormAlert } from "@/components/auth/form-alert";
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

/**
 * Botón que pide confirmación antes de una acción destructiva. Si la acción
 * se rechaza, el diálogo queda abierto con el motivo; si funciona y no
 * redirige, se cierra.
 */
export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  pendingLabel,
  action,
}: {
  triggerLabel: string;
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
        <Button variant="destructive" size="lg" className="h-11 w-full">
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
