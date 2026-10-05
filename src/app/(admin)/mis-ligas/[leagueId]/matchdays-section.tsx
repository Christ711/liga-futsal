import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageSection } from "@/components/layout/page-section";
import { MatchdayStatusBadge } from "@/components/matchday/status-badge";
import type { MatchdayStatus } from "@/domain/matchdays";
import { errorMessages } from "@/domain/result";
import { formatDay } from "@/lib/dates";
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
    <PageSection id="fechas" title="Fechas" description={description} level={1}>
      <div className="grid gap-4">
        {matchdays.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay fechas.</p>
        ) : (
          <ol aria-label="Fechas de la liga" className="grid gap-2">
            {matchdays.map((matchday) => (
              <li
                key={matchday.id}
                aria-labelledby={`matchday-${matchday.id}-label`}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <MatchdayLink leagueId={leagueId} matchday={matchday} />
                {finalized ? null : (
                  <details className="group/matchday border-t">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
                      <span className="underline">
                        <span className="group-open/matchday:hidden">Cambiar día o eliminar</span>
                        <span className="hidden group-open/matchday:inline">Cerrar</span>
                      </span>
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

/** Fila de la fecha: lleva a su vista con los partidos (RF-52). */
function MatchdayLink({ leagueId, matchday }: { leagueId: string; matchday: Matchday }) {
  return (
    <Link
      href={`/mis-ligas/${leagueId}/fechas/${matchday.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent"
    >
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span id={`matchday-${matchday.id}-label`} className="font-medium">
            Fecha {matchday.number}
          </span>
          <MatchdayStatusBadge status={matchday.status} pendingCount={matchday.pendingCount} />
        </span>
        <span className="text-sm text-muted-foreground first-letter:uppercase">
          {formatDay(matchday.playDate)}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
