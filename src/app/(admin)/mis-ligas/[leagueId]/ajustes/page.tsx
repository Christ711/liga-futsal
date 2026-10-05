import type { Metadata } from "next";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageSection } from "@/components/layout/page-section";
import { FinalizeLeagueDialog } from "@/components/league/finalize-league-dialog";
import { getLeagueAdmin } from "@/server/queries/league-admin";

import { LeagueForm } from "../../league-form";
import { deleteLeagueAction, finalizeLeagueAction, updateLeagueAction } from "../actions";
import { loadOwnedLeague } from "../owned-league";

type Props = { params: Promise<{ leagueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await loadOwnedLeague((await params).leagueId);
  return { title: `Ajustes - ${league.name} - Liga Futsal` };
}

/** Ajustes de la liga: sus datos, finalizarla y eliminarla (plan D22). */
export default async function LeagueSettingsPage({ params }: Props) {
  const { leagueId } = await params;
  await loadOwnedLeague(leagueId);
  const league = await getLeagueAdmin(leagueId);

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-6">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      {league.finalized ? null : (
        <PageSection id="datos-de-la-liga" title="Datos de la liga">
          <LeagueForm
            action={updateLeagueAction.bind(null, league.id)}
            defaultValues={{ name: league.name, semester: league.semester }}
            submitLabel="Guardar cambios"
            pendingLabel="Guardando..."
          />
        </PageSection>
      )}

      {league.finalized ? null : (
        <PageSection
          id="finalizar-liga"
          title="Finalizar liga"
          description="Al cierre del semestre, deja la liga en el historial con sus tablas finales."
        >
          <FinalizeLeagueDialog
            pendingCount={league.pendingCount}
            action={finalizeLeagueAction.bind(null, league.id)}
          />
        </PageSection>
      )}

      <PageSection
        id="eliminar-liga"
        title="Eliminar liga"
        description="Borra la liga con todos sus datos. No se puede deshacer."
      >
        <ConfirmDialog
          triggerLabel="Eliminar liga"
          title="¿Eliminar la liga?"
          description="Se borrarán todos sus datos: equipos, escudos, jugadores, fechas, partidos, goles y descuentos. Esta acción no se puede deshacer."
          confirmLabel="Eliminar liga"
          pendingLabel="Eliminando..."
          action={deleteLeagueAction.bind(null, league.id)}
        />
      </PageSection>
    </main>
  );
}
