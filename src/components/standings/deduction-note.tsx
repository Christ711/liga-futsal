import type { StandingsRow } from "@/domain/standings";

import { deductionNoteId } from "./standings-table";

const pointsLabel = (points: number) => (points === 1 ? "1 punto" : `${points} puntos`);

/** Motivo y cantidad de cada descuento, al que llevan los asteriscos de la tabla (RF-70). */
export function DeductionNotes({ rows }: { rows: StandingsRow[] }) {
  const penalized = rows.filter((row) => row.deductions.length > 0);
  if (penalized.length === 0) return null;

  return (
    <ul aria-label="Descuentos de puntos" className="grid gap-1 text-sm text-muted-foreground">
      {penalized.map((row) =>
        row.deductions.map((deduction, index) => (
          <li
            key={`${row.teamId}-${index}`}
            id={index === 0 ? deductionNoteId(row.teamId) : undefined}
            className="scroll-mt-20 wrap-break-word"
          >
            <span className="text-destructive">*</span> {row.teamName}:{" "}
            {pointsLabel(deduction.points)} por {deduction.reason}
          </li>
        )),
      )}
    </ul>
  );
}
