import { NameForm } from "./name-form";
import { PlayerEditor } from "./player-editor";
import {
  createPlayerAction,
  deletePlayerAction,
  transferPlayerAction,
  updatePlayerAction,
} from "./player-actions";

type Team = { id: string; name: string };

/** Jugadores de un equipo; mientras la liga está en curso se agregan y editan aquí (RF-33 a RF-39). */
export function PlayersPanel({
  leagueId,
  team,
  players,
  otherTeams,
  editable,
}: {
  leagueId: string;
  team: Team;
  players: { id: string; name: string }[];
  otherTeams: Team[];
  editable: boolean;
}) {
  const headingId = `team-${team.id}-players`;

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <h3 id={headingId} className="font-semibold">
        Jugadores
      </h3>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay jugadores.</p>
      ) : (
        <ul aria-label={`Jugadores de ${team.name}`} className="grid divide-y rounded-lg border">
          {players.map((player) => {
            const nameId = `player-${player.id}-label`;
            return (
              <li key={player.id} aria-labelledby={nameId}>
                {editable ? (
                  <details className="group/player">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                      <span id={nameId} className="min-w-0 flex-1 wrap-anywhere">
                        {player.name}
                      </span>
                      <span className="text-sm text-muted-foreground underline">
                        <span className="group-open/player:hidden">Editar</span>
                        <span className="hidden group-open/player:inline">Cerrar</span>
                      </span>
                    </summary>
                    <div className="border-t px-3 py-4">
                      <PlayerEditor
                        player={player}
                        otherTeams={otherTeams}
                        renameAction={updatePlayerAction.bind(null, leagueId, player.id)}
                        transferAction={transferPlayerAction.bind(null, leagueId, player.id)}
                        deleteAction={deletePlayerAction.bind(null, leagueId, player.id)}
                      />
                    </div>
                  </details>
                ) : (
                  <p id={nameId} className="px-3 py-2 wrap-anywhere">
                    {player.name}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {editable ? (
        <NameForm
          action={createPlayerAction.bind(null, leagueId, team.id)}
          id={`team-${team.id}-new-player`}
          label="Nuevo jugador"
          submitLabel="Agregar jugador"
          pendingLabel="Agregando..."
          hint="Solo el nombre a mostrar, hasta 40 caracteres. No se puede repetir en la liga."
        />
      ) : null}
    </section>
  );
}
