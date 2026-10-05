"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { GoalSheet } from "@/components/matchday/goal-sheet";
import { MatchCard } from "@/components/matchday/match-card";
import type { AppError, Result } from "@/domain/result";
import {
  withGoalAdded,
  withGoalReassigned,
  withGoalRemoved,
  withMatchMoved,
  withMatchStatus,
  type GoalTarget,
  type MatchdayView,
  type ViewGoal,
  type ViewMatch,
} from "@/lib/matchday-view";

import {
  addGoalAction,
  finishMatchAction,
  moveMatchAction,
  reassignGoalAction,
  removeGoalAction,
  revertMatchAction,
} from "./actions";

/** Rechazo de una Server Action convertido en error, conservando código y mensaje (ADR 011). */
class ActionError extends Error {
  constructor(readonly appError: AppError) {
    super(appError.message);
  }
}

const MUTATION_KEY = ["matchday-change"];

type SheetState =
  { mode: "add"; match: ViewMatch } | { mode: "reassign"; match: ViewMatch; goal: ViewGoal } | null;

/**
 * Vista de la fecha en la cancha (RF-52 a RF-58, RF-84). Cada cambio se ve al
 * instante y se revierte si el servidor lo rechaza; al terminar se vuelve a
 * leer la fecha y se invalidan las tablas de la liga (ADR 011).
 */
export function MatchdayMatches({ initialView }: { initialView: MatchdayView }) {
  const { leagueId, matchday } = initialView;
  const queryKey = ["matchday", leagueId, matchday.id];
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);

  const { data: view } = useQuery({
    queryKey,
    queryFn: async (): Promise<MatchdayView> => {
      const response = await fetch(`/api/leagues/${leagueId}/matchdays/${matchday.id}`);
      if (!response.ok) throw new Error(`La fecha respondió ${response.status}.`);
      return response.json();
    },
    initialData: initialView,
  });

  /** Mutación optimista: aplica el cambio en la caché, llama a la acción y revierte si falla. */
  function useChange<V>(
    action: (variables: V) => Promise<Result<unknown>>,
    apply: (view: MatchdayView, variables: V) => MatchdayView,
  ) {
    return useMutation({
      mutationKey: MUTATION_KEY,
      mutationFn: async (variables: V) => {
        const result = await action(variables);
        if (!result.ok) throw new ActionError(result.error);
      },
      onMutate: async (variables: V) => {
        setError(null);
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MatchdayView>(queryKey);
        queryClient.setQueryData<MatchdayView>(queryKey, (current) =>
          current ? apply(current, variables) : current,
        );
        return { previous };
      },
      onError: (failure, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
        setError(
          failure instanceof ActionError
            ? failure.appError.message
            : "No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.",
        );
      },
      onSettled: () => {
        // Con varios cambios en vuelo, se vuelve a leer solo al terminar el último.
        if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) === 1) {
          void queryClient.invalidateQueries({ queryKey });
          void queryClient.invalidateQueries({ queryKey: ["tables", leagueId] });
        }
      },
    });
  }

  const addGoal = useChange(
    (goal: GoalTarget & { matchId: string; id: string }) =>
      addGoalAction(leagueId, {
        matchId: goal.matchId,
        teamId: goal.teamId,
        scorerId: goal.scorerId,
      }),
    withGoalAdded,
  );
  const removeGoal = useChange(
    (goalId: string) => removeGoalAction(leagueId, goalId),
    withGoalRemoved,
  );
  const reassignGoal = useChange(
    (change: GoalTarget & { goalId: string }) => reassignGoalAction(leagueId, change),
    withGoalReassigned,
  );
  const finish = useChange(
    (matchId: string) => finishMatchAction(leagueId, matchId),
    (current, matchId) => withMatchStatus(current, matchId, "finished"),
  );
  const revert = useChange(
    (matchId: string) => revertMatchAction(leagueId, matchId),
    (current, matchId) => withMatchStatus(current, matchId, "pending"),
  );
  const move = useChange(
    (change: { matchId: string; direction: "up" | "down" }) => moveMatchAction(leagueId, change),
    (current, change) => withMatchMoved(current, change.matchId, change.direction),
  );

  const teamById = new Map(view.teams.map((team) => [team.id, team]));

  function pick(target: GoalTarget) {
    if (!sheet) return;
    if (sheet.mode === "add") {
      addGoal.mutate({ ...target, matchId: sheet.match.id, id: `temporal-${crypto.randomUUID()}` });
    } else {
      reassignGoal.mutate({ ...target, goalId: sheet.goal.id });
    }
    setSheet(null);
  }

  const sheetTeams = sheet
    ? [teamById.get(sheet.match.teamAId)!, teamById.get(sheet.match.teamBId)!]
    : [];
  const sheetTitle = !sheet
    ? ""
    : sheet.mode === "add"
      ? `Gol en ${sheetTeams[0]!.name} contra ${sheetTeams[1]!.name}`
      : `Reasignar gol de ${sheet.goal.scorer?.name ?? "Gol sin autor"}`;

  return (
    <div className="grid gap-3">
      {error ? <FormAlert>{error}</FormAlert> : null}
      <ol aria-label="Partidos de la fecha" className="grid gap-3">
        {view.matches.map((match, index) => (
          <MatchCard
            key={match.id}
            match={match}
            teamA={teamById.get(match.teamAId)!}
            teamB={teamById.get(match.teamBId)!}
            isFirst={index === 0}
            isLast={index === view.matches.length - 1}
            editable={view.editable}
            actions={{
              onAddGoal: () => setSheet({ mode: "add", match }),
              onFinish: () => finish.mutate(match.id),
              onRevert: () => revert.mutate(match.id),
              onMove: (direction) => move.mutate({ matchId: match.id, direction }),
              onRemoveGoal: (goal) => removeGoal.mutate(goal.id),
              onReassignGoal: (goal) => setSheet({ mode: "reassign", match, goal }),
            }}
          />
        ))}
      </ol>
      <GoalSheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
        title={sheetTitle}
        teams={sheetTeams}
        onPick={pick}
      />
    </div>
  );
}
