import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/server/auth/session";
import { isAdminEmail } from "@/server/auth/admin";
import { getMyLeagues, getOtherLeagues } from "@/server/queries/my-leagues";

export const metadata: Metadata = { title: "Mis ligas - Liga Futsal" };

export default async function MyLeaguesPage() {
  const session = await requireSession();
  const { inProgress, finalized } = await getMyLeagues(session.user.id);
  const empty = inProgress.length === 0 && finalized.length === 0;
  // RF-110: el administrador también ve las ligas de los demás ayudantes.
  const others = isAdminEmail(session.user.email) ? await getOtherLeagues(session.user.id) : null;

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mis ligas</h1>
        {empty ? null : (
          <Button asChild size="sm">
            <Link href="/mis-ligas/nueva">Nueva liga</Link>
          </Button>
        )}
      </div>

      {empty ? (
        <div className="grid justify-items-start gap-3 rounded-xl border bg-card p-6">
          <p>Todavía no tienes ligas.</p>
          <Button asChild size="lg" className="h-11">
            <Link href="/mis-ligas/nueva">Crear liga</Link>
          </Button>
        </div>
      ) : (
        <>
          <LeagueGroup id="en-curso" title="En curso" emptyText="No tienes ligas en curso.">
            {inProgress.map((league) => (
              <InProgressItem key={league.id} league={league} />
            ))}
          </LeagueGroup>
          <LeagueGroup
            id="finalizadas"
            title="Finalizadas"
            emptyText="Todavía no has finalizado ninguna liga."
          >
            {finalized.map((league) => (
              <LeagueItem key={league.id} league={league} />
            ))}
          </LeagueGroup>
        </>
      )}

      {others ? (
        <>
          <LeagueGroup
            id="otras-en-curso"
            title="Otras ligas en curso"
            emptyText="No hay ligas en curso de otros ayudantes."
          >
            {others.inProgress.map((league) => (
              <InProgressItem key={league.id} league={league} />
            ))}
          </LeagueGroup>
          <LeagueGroup
            id="otras-finalizadas"
            title="Otras ligas finalizadas"
            emptyText="No hay ligas finalizadas de otros ayudantes."
          >
            {others.finalized.map((league) => (
              <LeagueItem key={league.id} league={league} />
            ))}
          </LeagueGroup>
        </>
      ) : null}
    </main>
  );
}

/** Liga en curso, con el aviso de semestre terminado y acceso a finalizarla (RF-94). */
function InProgressItem({
  league,
}: {
  league: { id: string; name: string; semester: string; semesterOver: boolean };
}) {
  return (
    <LeagueItem league={league}>
      {league.semesterOver ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm">
          <span className="font-medium text-amber-700">El semestre terminó</span>
          <Link href={`/mis-ligas/${league.id}/ajustes#finalizar-liga`} className="underline">
            Finalizar liga
          </Link>
        </p>
      ) : null}
    </LeagueItem>
  );
}

function LeagueGroup({
  id,
  title,
  emptyText,
  children,
}: {
  id: string;
  title: string;
  emptyText: string;
  children: ReactNode[];
}) {
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="grid gap-2">{children}</ul>
      )}
    </section>
  );
}

function LeagueItem({
  league,
  children,
}: {
  league: { id: string; name: string; semester: string };
  children?: ReactNode;
}) {
  return (
    <li className="rounded-xl border bg-card px-4 py-3">
      <Link
        href={`/mis-ligas/${league.id}`}
        className="font-medium wrap-anywhere underline-offset-4 hover:underline"
      >
        {league.name}
      </Link>
      <p className="text-sm text-muted-foreground">Semestre {league.semester}</p>
      {children}
    </li>
  );
}
