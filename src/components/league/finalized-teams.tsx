import { Crest } from "@/components/crest/crest";

/** Equipos de una liga finalizada con su escudo y su lista de jugadores (RF-74, RF-82). */
export function FinalizedTeams({
  teams,
}: {
  teams: {
    id: string;
    name: string;
    crestHash: string | null;
    players: { id: string; name: string }[];
  }[];
}) {
  return (
    <ul className="grid gap-2">
      {teams.map((team) => (
        <li
          key={team.id}
          aria-labelledby={`equipo-final-${team.id}`}
          className="grid gap-2 rounded-xl border px-4 py-3"
        >
          <span className="flex items-center gap-3">
            <Crest teamId={team.id} name={team.name} crestHash={team.crestHash} size={32} />
            <span id={`equipo-final-${team.id}`} className="font-medium wrap-anywhere">
              {team.name}
            </span>
          </span>
          {team.players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin jugadores.</p>
          ) : (
            <p className="text-sm wrap-break-word text-muted-foreground">
              {team.players.map((player) => player.name).join(", ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
