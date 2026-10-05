import { Button } from "@/components/ui/button";
import type { ViewGoal, ViewTeam } from "@/lib/matchday-view";

/** Goles de un partido con acciones para quitarlos o reasignarlos (RF-57). */
export function GoalList({
  goals,
  teams,
  editable,
  onRemove,
  onReassign,
}: {
  goals: ViewGoal[];
  teams: ViewTeam[];
  editable: boolean;
  onRemove: (goal: ViewGoal) => void;
  onReassign: (goal: ViewGoal) => void;
}) {
  const teamName = (teamId: string) => teams.find((team) => team.id === teamId)?.name ?? "";

  return (
    <details className="group/goals border-t">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Goles ({goals.length})
        <span className="text-muted-foreground underline">
          <span className="group-open/goals:hidden">Ver</span>
          <span className="hidden group-open/goals:inline">Ocultar</span>
        </span>
      </summary>
      {goals.length === 0 ? (
        <p className="px-4 pb-3 text-sm text-muted-foreground">Todavía no hay goles.</p>
      ) : (
        <ol aria-label="Goles del partido" className="grid divide-y border-t">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-center gap-2 px-4 py-2">
              <span className="grid min-w-0 flex-1 text-sm">
                <span className="font-medium wrap-anywhere">
                  {goal.scorer?.name ?? "Gol sin autor"}
                </span>
                <span className="text-xs wrap-anywhere text-muted-foreground">
                  {teamName(goal.teamId)}
                </span>
              </span>
              {editable ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10"
                    onClick={() => onReassign(goal)}
                  >
                    Reasignar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 text-destructive"
                    onClick={() => onRemove(goal)}
                  >
                    Quitar
                  </Button>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
