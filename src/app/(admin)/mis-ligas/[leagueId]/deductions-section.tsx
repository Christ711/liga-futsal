import { PageSection } from "@/components/layout/page-section";

import {
  createDeductionAction,
  deleteDeductionAction,
  updateDeductionAction,
} from "./deduction-actions";
import { AddDeductionForm, DeductionEditor } from "./deduction-forms";

type Deduction = { id: string; points: number; reason: string; teamName: string };

const pointsLabel = (points: number) => (points === 1 ? "1 punto" : `${points} puntos`);

/** Descuentos de puntos de la liga: varios por equipo, editables mientras está en curso (RF-67 a RF-69). */
export function DeductionsSection({
  leagueId,
  teams,
  deductions,
  finalized,
}: {
  leagueId: string;
  teams: { id: string; name: string }[];
  deductions: Deduction[];
  finalized: boolean;
}) {
  const description = finalized
    ? undefined
    : teams.length === 0
      ? "Agrega equipos para poder aplicar descuentos."
      : "Se restan de los puntos del equipo en la tabla, que pueden quedar negativos.";

  return (
    <PageSection id="descuentos" title="Descuentos de puntos" description={description}>
      <div className="grid gap-4">
        {deductions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay descuentos aplicados.</p>
        ) : (
          <ul aria-label="Descuentos aplicados" className="grid gap-2">
            {deductions.map((deduction) => (
              <li key={deduction.id} className="rounded-xl border">
                {finalized ? (
                  <DeductionRow deduction={deduction} />
                ) : (
                  <details className="group/deduction">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <DeductionRow deduction={deduction} editable />
                    </summary>
                    <div className="border-t px-4 py-4">
                      <DeductionEditor
                        deduction={deduction}
                        updateAction={updateDeductionAction.bind(null, leagueId, deduction.id)}
                        deleteAction={deleteDeductionAction.bind(null, leagueId, deduction.id)}
                      />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
        {!finalized && teams.length > 0 ? (
          <AddDeductionForm action={createDeductionAction.bind(null, leagueId)} teams={teams} />
        ) : null}
      </div>
    </PageSection>
  );
}

function DeductionRow({
  deduction,
  editable = false,
}: {
  deduction: Deduction;
  editable?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="font-medium wrap-anywhere">
          {deduction.teamName} · {pointsLabel(deduction.points)}
        </p>
        <p className="text-sm wrap-anywhere text-muted-foreground">{deduction.reason}</p>
      </div>
      {editable ? (
        <span className="text-sm text-muted-foreground underline">
          <span className="group-open/deduction:hidden">Editar</span>
          <span className="hidden group-open/deduction:inline">Cerrar</span>
        </span>
      ) : null}
    </div>
  );
}
