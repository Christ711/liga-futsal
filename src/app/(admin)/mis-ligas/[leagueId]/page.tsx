import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageSection } from "@/components/layout/page-section";
import { getLeagueAdmin } from "@/server/queries/league-admin";

import { LeagueForm } from "../league-form";
import { deleteLeagueAction, updateLeagueAction } from "./actions";
import { loadOwnedLeague } from "./owned-league";
import { TeamsSection } from "./teams-section";

type Props = { params: Promise<{ leagueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await loadOwnedLeague((await params).leagueId);
  return { title: `${league.name} - Liga Futsal` };
}

export default async function LeagueAdminPage({ params }: Props) {
  const { leagueId } = await params;
  // El layout y la página se renderizan en paralelo: la página también autoriza
  // (sin consulta extra, por `cache`) antes de leer datos de la liga.
  await loadOwnedLeague(leagueId);
  const league = await getLeagueAdmin(leagueId);

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-8">
      <div className="grid gap-1">
        <Link href="/mis-ligas" className="text-sm text-muted-foreground underline">
          Volver a mis ligas
        </Link>
        <h1 className="text-2xl font-semibold wrap-anywhere">{league.name}</h1>
        <p className="text-sm text-muted-foreground">
          Semestre {league.semester} ·{" "}
          <span className="font-medium text-foreground">
            {league.finalized ? "Finalizada" : "En curso"}
          </span>
        </p>
      </div>

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

      <TeamsSection
        leagueId={league.id}
        teams={league.teams}
        finalized={league.finalized}
        canChangeTeams={league.canChangeTeams}
      />

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
