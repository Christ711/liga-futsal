import type { ReactNode } from "react";

import { requireSession } from "@/server/auth/session";

import { loadOwnedLeague } from "./owned-league";

/**
 * Toda ruta bajo una liga se autoriza aquí antes de renderizar (RF-13, RF-93).
 * Si la administra una cuenta administradora que no es su dueña, se lo avisa
 * en todas sus páginas (RF-111).
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
    <>
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
    </>
  );
}
