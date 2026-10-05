import { ChevronDown, ChevronUp } from "lucide-react";

import { Crest } from "@/components/crest/crest";
import { Button } from "@/components/ui/button";
import { matchScore } from "@/domain/matches";
import type { ViewGoal, ViewMatch, ViewTeam } from "@/lib/matchday-view";

import { GoalList } from "./goal-list";
import { MatchStatusBadge } from "./status-badge";

export type MatchCardActions = {
  onAddGoal: () => void;
  onFinish: () => void;
  onRevert: () => void;
  onMove: (direction: "up" | "down") => void;
  onRemoveGoal: (goal: ViewGoal) => void;
  onReassignGoal: (goal: ViewGoal) => void;
};

/**
 * Un partido de la fecha: sus dos equipos sin local ni visita (RF-47), su
 * marcador calculado desde los goles (RF-55) y su estado (RF-52). Mientras la
 * liga está en curso y el partido no está bloqueado, ofrece sus acciones.
 */
export function MatchCard({
  match,
  teamA,
  teamB,
  isFirst,
  isLast,
  editable,
  actions,
}: {
  match: ViewMatch;
  teamA: ViewTeam;
  teamB: ViewTeam;
  isFirst: boolean;
  isLast: boolean;
  /** La liga está en curso. */
  editable: boolean;
  actions: MatchCardActions;
}) {
  const score = matchScore({
    ...match,
    goals: match.goals.map((goal) => ({ teamId: goal.teamId, scorerId: goal.scorer?.id ?? null })),
  });
  const canChange = editable && !match.locked;

  return (
    <li
      aria-label={`Partido ${match.position}: ${teamA.name} contra ${teamB.name}`}
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="text-sm font-medium text-muted-foreground">#{match.position}</span>
        <MatchStatusBadge status={match.status} locked={match.locked} />
        {editable ? (
          <span className="ml-auto flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Subir partido"
              disabled={isFirst}
              onClick={() => actions.onMove("up")}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Bajar partido"
              disabled={isLast}
              onClick={() => actions.onMove("down")}
            >
              <ChevronDown />
            </Button>
          </span>
        ) : null}
      </div>

      <div className="grid gap-2 px-4 py-3">
        <TeamScore team={teamA} goals={score.teamA} />
        <TeamScore team={teamB} goals={score.teamB} />
      </div>

      {canChange ? (
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          <Button type="button" size="lg" className="h-11" onClick={actions.onAddGoal}>
            Agregar gol
          </Button>
          {match.status === "pending" ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={actions.onFinish}
            >
              Terminar partido
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="lg"
              // Dos líneas en 360 px antes que un texto que toque los bordes.
              className="h-11 px-3 leading-tight whitespace-normal"
              onClick={actions.onRevert}
            >
              Devolver a pendiente
            </Button>
          )}
        </div>
      ) : null}

      <GoalList
        goals={match.goals}
        teams={[teamA, teamB]}
        editable={canChange}
        onRemove={actions.onRemoveGoal}
        onReassign={actions.onReassignGoal}
      />
    </li>
  );
}

function TeamScore({ team, goals }: { team: ViewTeam; goals: number }) {
  return (
    <div className="flex items-center gap-3">
      <Crest teamId={team.id} name={team.name} crestHash={team.crestHash} size={32} />
      <span className="min-w-0 flex-1 font-medium wrap-anywhere">{team.name}</span>
      <span
        aria-label={`Goles de ${team.name}`}
        className="min-w-8 text-right text-2xl font-semibold tabular-nums"
      >
        {goals}
      </span>
    </div>
  );
}
