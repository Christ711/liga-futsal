import type { TopScorerRow } from "@/domain/standings";

/** Tabla de goleadores con el equipo actual de cada jugador (RF-71, RF-72). */
export function TopScorersTable({ rows }: { rows: TopScorerRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay goles en partidos terminados.</p>
    );
  }
  return (
    <table className="w-full table-fixed border-collapse text-sm tabular-nums">
      <caption className="sr-only">Goleadores</caption>
      <colgroup>
        <col className="w-7" />
        <col />
        <col className="w-[38%]" />
        <col className="w-12" />
      </colgroup>
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th scope="col" className="py-2 text-left font-medium">
            <abbr title="Posición" className="no-underline">
              #
            </abbr>
          </th>
          <th scope="col" className="py-2 text-left font-medium">
            Jugador
          </th>
          <th scope="col" className="py-2 text-left font-medium">
            Equipo
          </th>
          <th scope="col" className="py-2 text-right font-semibold text-foreground">
            Goles
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.playerId} className="border-b last:border-b-0">
            <td className="py-2 align-top text-muted-foreground">{row.position}</td>
            <td className="py-2 pr-2 align-top font-medium wrap-break-word">{row.playerName}</td>
            <td className="py-2 pr-2 align-top wrap-break-word text-muted-foreground">
              {row.teamName}
            </td>
            <td className="py-2 text-right align-top font-semibold">{row.goals}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
