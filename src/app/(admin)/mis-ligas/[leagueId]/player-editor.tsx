"use client";

import { useActionState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import type { Result } from "@/domain/result";

import type { NoticeFormState } from "../../../form-state";
import { NameForm } from "./name-form";

type FormAction = (previous: NoticeFormState, formData: FormData) => Promise<NoticeFormState>;

/** Edición de un jugador: nombre, traspaso y eliminación (RF-34, RF-37 a RF-39). */
export function PlayerEditor({
  player,
  otherTeams,
  renameAction,
  transferAction,
  deleteAction,
}: {
  player: { id: string; name: string };
  otherTeams: { id: string; name: string }[];
  renameAction: FormAction;
  transferAction: FormAction;
  deleteAction: () => Promise<Result<null>>;
}) {
  return (
    <div className="grid gap-5">
      <NameForm
        action={renameAction}
        id={`player-${player.id}-name`}
        label="Nombre del jugador"
        submitLabel="Guardar nombre"
        pendingLabel="Guardando..."
        defaultValue={player.name}
      />
      {otherTeams.length > 0 ? (
        <TransferForm playerId={player.id} otherTeams={otherTeams} action={transferAction} />
      ) : null}
      <ConfirmDialog
        triggerLabel="Eliminar jugador"
        triggerVariant="outline"
        title={`¿Eliminar a ${player.name}?`}
        description="Se quitará de la liga. Si ya tiene goles registrados no se puede eliminar, pero puedes editar su nombre."
        confirmLabel="Eliminar jugador"
        pendingLabel="Eliminando..."
        action={deleteAction}
      />
    </div>
  );
}

function TransferForm({
  playerId,
  otherTeams,
  action,
}: {
  playerId: string;
  otherTeams: { id: string; name: string }[];
  action: FormAction;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-3">
      <SelectField
        id={`player-${playerId}-transfer`}
        name="teamId"
        label="Traspasar a"
        options={otherTeams.map((team) => ({ value: team.id, label: team.name }))}
        error={state?.ok === false ? state.error.message : undefined}
      />
      <Button type="submit" variant="outline" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Traspasando..." : "Traspasar"}
      </Button>
    </form>
  );
}
