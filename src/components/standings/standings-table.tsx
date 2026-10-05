import type { StandingsRow } from "@/domain/standings";

const COLUMNS = [
  { abbr: "PJ", title: "Partidos jugados" },
  { abbr: "PG", title: "Partidos ganados" },
  { abbr: "PE", title: "Partidos empatados" },
  { abbr: "PP", title: "Partidos perdidos" },
  { abbr: "GF", title: "Goles a favor" },
  { abbr: "GC", title: "Goles en contra" },
  { abbr: "DG", title: "Diferencia de gol" },
] as const;

/** Ancla de las notas de descuentos de un equipo, a la que lleva su asterisco (RF-70). */
export const deductionNoteId = (teamId: string) => `descuentos-${teamId}`;

/**
 * Tabla de posiciones (RF-62). Pensada para 360 px: números compactos y el
 * nombre del equipo en varias líneas antes que cortado. Los equipos con
 * descuentos llevan un asterisco que lleva a sus motivos (RF-70).
 */
export function StandingsTable({ rows }: { rows: StandingsRow[] }) {
  return (
    <table className="w-full table-fixed border-collapse text-[13px] tabular-nums">
      <caption className="sr-only">Tabla de posiciones</caption>
      <colgroup>
        <col className="w-6" />
        <col />
        {COLUMNS.map((column) => (
          <col key={column.abbr} className="w-[26px]" />
        ))}
        <col className="w-9" />
      </colgroup>
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th scope="col" className="py-2 text-left font-medium">
            <abbr title="Posición" className="no-underline">
              #
            </abbr>
          </th>
          <th scope="col" className="py-2 text-left font-medium">
            Equipo
          </th>
          {COLUMNS.map((column) => (
            <th key={column.abbr} scope="col" className="py-2 text-center font-medium">
              <abbr title={column.title} className="no-underline">
                {column.abbr}
              </abbr>
            </th>
          ))}
          <th scope="col" className="py-2 text-right font-semibold text-foreground">
            <abbr title="Puntos" className="no-underline">
              Pts
            </abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.teamId} className="border-b last:border-b-0">
            <td className="py-2 align-top text-muted-foreground">{row.position}</td>
            <td className="py-2 pr-1 align-top leading-snug font-medium wrap-break-word">
              {row.teamName}
            </td>
            {[
              row.played,
              row.won,
              row.drawn,
              row.lost,
              row.goalsFor,
              row.goalsAgainst,
              row.goalDifference,
            ].map((value, index) => (
              <td key={COLUMNS[index]!.abbr} className="py-2 text-center align-top">
                {value}
              </td>
            ))}
            <td className="py-2 text-right align-top font-semibold">
              {row.points}
              {row.deductions.length > 0 ? (
                <a
                  href={`#${deductionNoteId(row.teamId)}`}
                  aria-label={`Ver descuentos de ${row.teamName}`}
                  className="text-destructive no-underline"
                >
                  *
                </a>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
