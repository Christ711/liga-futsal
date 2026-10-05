import type { ReactNode } from "react";

import { LeagueNav } from "@/components/layout/league-nav";
import { requireSession } from "@/server/auth/session";

import { loadOwnedLeague } from "./owned-league";

/**
 * Toda ruta bajo una liga se autoriza aquí antes de renderizar (RF-13, RF-93),
 * y comparte el menú de sus vistas (plan D22). Si la administra una cuenta
 * administradora que no es su dueña, se lo avisa en todas sus páginas (RF-111).
 */
export default async function LeagueAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ leagueId: string }>;
}) {
  const [league, session] = await Promise.all([
    loadOwnedLeague((await params).leagueId),
    requireSession(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6 lg:px-4">
      <LeagueNav
        leagueId={league.id}
        leagueName={league.name}
        finalized={league.status === "FINALIZED"}
      />
      {/* En escritorio el contenido va junto al menú, no centrado en su columna. */}
      <div className="min-w-0 lg:[&>div]:mx-0 lg:[&>main]:mx-0 lg:[&>main]:max-w-2xl">
        {league.ownerId === session.user.id ? null : (
          <div className="mx-auto w-full max-w-lg px-4 pt-4">
            <p
              role="status"
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
            >
              Estás editando la liga de otro ayudante.
            </p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
