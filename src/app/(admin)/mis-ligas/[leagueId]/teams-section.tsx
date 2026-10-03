import { Crest } from "@/components/crest/crest";
import { PageSection } from "@/components/layout/page-section";
import { errorMessages } from "@/domain/result";

import { AddTeamForm } from "./add-team-form";
import {
  createTeamAction,
  deleteTeamAction,
  removeTeamCrestAction,
  setTeamCrestAction,
  updateTeamAction,
} from "./team-actions";
import { TeamEditor } from "./team-editor";

type Team = { id: string; name: string; crestHash: string | null; playerCount: number };

/** Equipos de la liga: alta y baja antes de la primera fecha, y edición mientras está en curso (RF-23 a RF-32). */
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
    <PageSection id="equipos" title="Equipos" description={description}>
      <div className="grid gap-4">
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay equipos.</p>
        ) : (
          <ul className="grid gap-2">
            {teams.map((team) => (
              <li key={team.id} className="rounded-xl border">
                {finalized ? (
                  <TeamRow team={team} />
                ) : (
                  <details className="group">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <TeamRow team={team} editable />
                    </summary>
                    <TeamEditor
                      team={team}
                      canDelete={canChangeTeams}
                      renameAction={updateTeamAction.bind(null, leagueId, team.id)}
                      crestAction={setTeamCrestAction.bind(null, leagueId, team.id)}
                      removeCrestAction={removeTeamCrestAction.bind(null, leagueId, team.id)}
                      deleteAction={deleteTeamAction.bind(null, leagueId, team.id)}
                    />
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
        {canChangeTeams ? <AddTeamForm action={createTeamAction.bind(null, leagueId)} /> : null}
      </div>
    </PageSection>
  );
}

function TeamRow({ team, editable = false }: { team: Team; editable?: boolean }) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <Crest teamId={team.id} name={team.name} crestHash={team.crestHash} />
      <span className="min-w-0 flex-1 font-medium wrap-anywhere">{team.name}</span>
      {editable ? (
        <span className="text-sm text-muted-foreground underline">
          <span className="group-open:hidden">Editar</span>
          <span className="hidden group-open:inline">Cerrar</span>
        </span>
      ) : null}
    </div>
  );
}
