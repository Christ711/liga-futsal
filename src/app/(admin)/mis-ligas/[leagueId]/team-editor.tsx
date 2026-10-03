"use client";

import { useActionState, useState, type FormEvent } from "react";

import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { errorMessages, type Result } from "@/domain/result";
import { cn } from "@/lib/utils";

import type { NoticeFormState } from "../../../form-state";
import { teamDeletionWarning } from "./team-deletion-warning";

type FormAction = (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;

/** Mismo límite que el servidor (RF-28); revisarlo antes evita subir archivos que se rechazarán. */
const MAX_CREST_BYTES = 2 * 1024 * 1024;

/** Edición de un equipo: nombre, escudo y, si la liga no tiene fechas, eliminarlo (RF-25, RF-32, RF-95). */
export function TeamEditor({
  team,
  canDelete,
  renameAction,
  crestAction,
  removeCrestAction,
  deleteAction,
}: {
  team: { id: string; name: string; crestHash: string | null; playerCount: number };
  canDelete: boolean;
  renameAction: FormAction;
  crestAction: FormAction;
  removeCrestAction: () => Promise<NoticeFormState>;
  deleteAction: () => Promise<Result<null>>;
}) {
  return (
    <div className="grid gap-6 border-t px-4 py-4">
      <RenameForm team={team} action={renameAction} />
      <CrestForm team={team} action={crestAction} removeAction={removeCrestAction} />
      {canDelete ? (
        <ConfirmDialog
          triggerLabel="Eliminar equipo"
          title={`¿Eliminar ${team.name}?`}
          description={teamDeletionWarning({
            playerCount: team.playerCount,
            hasCrest: team.crestHash !== null,
          })}
          confirmLabel="Eliminar equipo"
          pendingLabel="Eliminando..."
          action={deleteAction}
        />
      ) : null}
    </div>
  );
}

function RenameForm({ team, action }: { team: { id: string; name: string }; action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, null);
  const error = state?.ok === false ? state.error : undefined;

  return (
    <form action={formAction} className="grid gap-3" noValidate>
      <FormField
        id={`team-${team.id}-name`}
        name="name"
        label="Nombre"
        autoComplete="off"
        required
        defaultValue={state?.ok === false ? state.values.name : team.name}
        error={error?.fields?.name ?? (error ? error.message : undefined)}
      />
      <Button type="submit" variant="outline" className="h-11 w-full" disabled={pending}>
        {pending ? "Guardando..." : "Guardar nombre"}
      </Button>
    </form>
  );
}

function CrestForm({
  team,
  action,
  removeAction,
}: {
  team: { id: string; crestHash: string | null };
  action: FormAction;
  removeAction: () => Promise<NoticeFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [removeState, remove, removing] = useActionState(removeAction, null);
  const [tooBig, setTooBig] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const error = tooBig
    ? errorMessages.CREST_INVALID
    : state?.ok === false
      ? (state.error.fields?.crest ?? state.error.message)
      : undefined;

  function checkSize(event: FormEvent<HTMLFormElement>) {
    const file = new FormData(event.currentTarget).get("crest");
    const exceeds = file instanceof File && file.size > MAX_CREST_BYTES;
    setTooBig(exceeds);
    if (exceeds) event.preventDefault();
  }

  return (
    <div className="grid gap-3">
      <form
        action={formAction}
        onSubmit={checkSize}
        // Tras un envío exitoso React limpia el formulario; el nombre mostrado también.
        onReset={() => setFileName(null)}
        className="grid gap-3"
        noValidate
      >
        <CrestPicker
          id={`team-${team.id}-crest`}
          error={error}
          fileName={fileName}
          onFileNameChange={setFileName}
        />
        <Button type="submit" variant="outline" className="h-11 w-full" disabled={pending}>
          {pending ? "Subiendo..." : team.crestHash ? "Reemplazar escudo" : "Subir escudo"}
        </Button>
      </form>
      {team.crestHash ? (
        <form action={remove}>
          {removeState?.ok === false ? <FormAlert>{removeState.error.message}</FormAlert> : null}
          <Button type="submit" variant="ghost" className="h-11 w-full" disabled={removing}>
            {removing ? "Quitando..." : "Quitar escudo"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/**
 * Selector de archivo con textos propios: el control nativo muestra sus
 * textos en el idioma del navegador. El campo real queda oculto a la vista,
 * pero sigue siendo el que recibe el foco y se llama "Escudo".
 */
function CrestPicker({
  id,
  error,
  fileName,
  onFileNameChange,
}: {
  id: string;
  error?: string;
  fileName: string | null;
  onFileNameChange: (name: string | null) => void;
}) {
  const messageId = `${id}-message`;

  return (
    <div className="grid gap-2">
      <Label id={`${id}-label`} htmlFor={id}>
        Escudo
      </Label>
      <input
        id={id}
        name="crest"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="peer sr-only"
        aria-labelledby={`${id}-label`}
        aria-describedby={messageId}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onFileNameChange(event.currentTarget.files?.[0]?.name ?? null)}
      />
      <label
        htmlFor={id}
        className={cn(
          "flex h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm shadow-xs",
          "peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
          error ? "border-destructive" : "border-input",
        )}
      >
        <span className="shrink-0 rounded-sm bg-muted px-2 py-1 font-medium">Elegir imagen</span>
        <span className="min-w-0 truncate text-muted-foreground">
          {fileName ?? "Ningún archivo elegido"}
        </span>
      </label>
      <p
        id={messageId}
        className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
      >
        {error ?? "PNG, JPG o WebP de hasta 2 MB."}
      </p>
    </div>
  );
}
