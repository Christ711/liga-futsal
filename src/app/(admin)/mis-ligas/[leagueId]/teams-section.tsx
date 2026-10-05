import { Crest } from "@/components/crest/crest";
import { PageSection } from "@/components/layout/page-section";
import { errorMessages } from "@/domain/result";

import { NameForm } from "./name-form";
import { PlayersPanel } from "./players-panel";
import {
  createTeamAction,
  deleteTeamAction,
  removeTeamCrestAction,
  setTeamCrestAction,
  updateTeamAction,
} from "./team-actions";
import { TeamEditor } from "./team-editor";

type Team = {
  id: string;
  name: string;
  crestHash: string | null;
  players: { id: string; name: string }[];
};

/**
 * Equipos de la liga con sus jugadores: alta y baja de equipos antes de la
 * primera fecha, y edición mientras la liga está en curso (RF-23 a RF-39).
 */
export function TeamsSection({
  leagueId,
  teams,
  finalized,
  canChangeTeams,
}: {
  leagueId: string;
  teams: Team[];
  finalized: boolean;
  canChangeTeams: boolean;
}) {
  const description = finalized
    ? undefined
    : canChangeTeams
      ? "Agrega todos los equipos antes de generar la primera fecha. Se necesitan al menos 3."
      : errorMessages.TEAMS_LOCKED;

  return (
    <PageSection id="equipos" title="Equipos" description={description} level={1}>
      <div className="grid gap-4">
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay equipos.</p>
        ) : (
          <ul aria-label="Equipos de la liga" className="grid gap-2">
            {teams.map((team) => (
              <li
                key={team.id}
                aria-labelledby={`team-${team.id}-label`}
                className="rounded-xl border bg-card"
              >
                <details className="group/team">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <TeamRow team={team} openLabel={finalized ? "Ver jugadores" : "Editar"} />
                  </summary>
                  <div className="grid gap-6 border-t px-4 py-4">
                    <PlayersPanel
                      leagueId={leagueId}
                      team={team}
                      players={team.players}
                      otherTeams={teams.filter((other) => other.id !== team.id)}
                      editable={!finalized}
                    />
                    {finalized ? null : (
                      <section
                        aria-labelledby={`team-${team.id}-details`}
                        className="grid gap-4 border-t pt-5"
                      >
                        <h3 id={`team-${team.id}-details`} className="font-semibold">
                          Datos del equipo
                        </h3>
                        <TeamEditor
                          team={{ ...team, playerCount: team.players.length }}
                          canDelete={canChangeTeams}
                          renameAction={updateTeamAction.bind(null, leagueId, team.id)}
                          crestAction={setTeamCrestAction.bind(null, leagueId, team.id)}
                          removeCrestAction={removeTeamCrestAction.bind(null, leagueId, team.id)}
                          deleteAction={deleteTeamAction.bind(null, leagueId, team.id)}
                        />
                      </section>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        {canChangeTeams ? (
          <NameForm
            action={createTeamAction.bind(null, leagueId)}
            id="new-team-name"
            label="Nuevo equipo"
            submitLabel="Agregar equipo"
            pendingLabel="Agregando..."
            hint="Hasta 30 caracteres."
            primary
          />
        ) : null}
      </div>
    </PageSection>
  );
}

function TeamRow({ team, openLabel }: { team: Team; openLabel: string }) {
  const count = team.players.length;
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <Crest teamId={team.id} name={team.name} crestHash={team.crestHash} />
      <span className="grid min-w-0 flex-1">
        <span id={`team-${team.id}-label`} className="font-medium wrap-anywhere">
          {team.name}
        </span>
        <span className="text-sm text-muted-foreground">
          {count === 1 ? "1 jugador" : `${count} jugadores`}
        </span>
      </span>
      <span className="text-sm text-muted-foreground underline">
        <span className="group-open/team:hidden">{openLabel}</span>
        <span className="hidden group-open/team:inline">Cerrar</span>
      </span>
    </div>
  );
}
