import { Crest } from "@/components/crest/crest";

import { MatchStatusBadge } from "./status-badge";

type Team = { id: string; name: string; crestHash: string | null };

/** Resultado de un partido en modo lectura, para la parte pública (RF-81). */
export function MatchResult({
  teamA,
  teamB,
  status,
  score,
}: {
  teamA: Team;
  teamB: Team;
  status: "pending" | "finished";
  score: { teamA: number; teamB: number };
}) {
  return (
    <li aria-label={`${teamA.name} contra ${teamB.name}`} className="grid gap-1.5 px-4 py-3">
      <TeamLine team={teamA} goals={score.teamA} />
      <TeamLine team={teamB} goals={score.teamB} />
      <span>
        <MatchStatusBadge status={status} locked={false} />
      </span>
    </li>
  );
}

function TeamLine({ team, goals }: { team: Team; goals: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <Crest teamId={team.id} name={team.name} crestHash={team.crestHash} size={24} />
      <span className="min-w-0 flex-1 text-sm font-medium wrap-anywhere">{team.name}</span>
      <span aria-label={`Goles de ${team.name}`} className="text-lg font-semibold tabular-nums">
        {goals}
      </span>
    </span>
  );
}
