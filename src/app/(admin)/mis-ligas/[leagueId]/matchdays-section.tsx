import { PageSection } from "@/components/layout/page-section";
import type { MatchdayStatus } from "@/domain/matchdays";
import { errorMessages } from "@/domain/result";
import { formatDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { today } from "@/server/time";

import {
  deleteMatchdayAction,
  generateMatchdayAction,
  updateMatchdayDateAction,
} from "./matchday-actions";
import { GenerateMatchdayDialog, MatchdayEditor } from "./matchday-forms";

type Matchday = {
  id: string;
  number: number;
  playDate: string;
  status: MatchdayStatus;
  pendingCount: number;
  finishedCount: number;
};

/** Texto del estado de una fecha (RF-48, RF-104, RF-105). */
function statusLabel(matchday: Matchday): string {
  if (matchday.status === "open") return "Abierta";
  if (matchday.status === "incomplete") return `Incompleta (${matchday.pendingCount})`;
  return "Finalizada";
}

const STATUS_STYLES: Record<MatchdayStatus, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-800",
  incomplete: "border-amber-200 bg-amber-50 text-amber-800",
  finalized: "border-border bg-muted text-muted-foreground",
};

/** Fechas de la liga numeradas por día de juego, con su estado (RF-41 a RF-51, RF-97 a RF-105). */
export function MatchdaysSection({
  leagueId,
  matchdays,
  finalized,
  generateBlocker,
}: {
  leagueId: string;
  matchdays: Matchday[];
  finalized: boolean;
  generateBlocker: "NOT_ENOUGH_TEAMS" | "MATCHDAY_OPEN" | null;
}) {
  const description = finalized
    ? undefined
    : generateBlocker
      ? errorMessages[generateBlocker]
      : "Cada fecha es todos contra todos.";

  return (
    <PageSection id="fechas" title="Fechas" description={description}>
      <div className="grid gap-4">
        {matchdays.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay fechas.</p>
        ) : (
          <ol aria-label="Fechas de la liga" className="grid gap-2">
            {matchdays.map((matchday) => (
              <li
                key={matchday.id}
                aria-labelledby={`matchday-${matchday.id}-label`}
                className="rounded-xl border"
              >
                {finalized ? (
                  <MatchdayRow matchday={matchday} />
                ) : (
                  <details className="group/matchday">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <MatchdayRow matchday={matchday} editable />
                    </summary>
                    <div className="border-t px-4 py-4">
                      <MatchdayEditor
                        matchday={matchday}
                        updateAction={updateMatchdayDateAction.bind(null, leagueId, matchday.id)}
                        deleteAction={deleteMatchdayAction.bind(null, leagueId, matchday.id)}
                      />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ol>
        )}
        {finalized ? null : (
          <GenerateMatchdayDialog
            action={generateMatchdayAction.bind(null, leagueId)}
            today={today()}
            disabled={generateBlocker !== null}
          />
        )}
      </div>
    </PageSection>
  );
}

function MatchdayRow({ matchday, editable = false }: { matchday: Matchday; editable?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span id={`matchday-${matchday.id}-label`} className="font-medium">
            Fecha {matchday.number}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              STATUS_STYLES[matchday.status],
            )}
          >
            {statusLabel(matchday)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {formatDay(matchday.playDate)}
        </p>
      </div>
      {editable ? (
        <span className="text-sm text-muted-foreground underline">
          <span className="group-open/matchday:hidden">Editar</span>
          <span className="hidden group-open/matchday:inline">Cerrar</span>
        </span>
      ) : null}
    </div>
  );
}
