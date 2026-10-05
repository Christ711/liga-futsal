import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { SemesterGroup } from "@/server/queries/home";

/**
 * Portada: ligas en curso y, a continuación, el historial de finalizadas,
 * agrupadas por semestre del más reciente al más antiguo (RF-80, RF-108).
 */
export function HomeView({
  inProgress,
  finalized,
}: {
  inProgress: SemesterGroup[];
  finalized: SemesterGroup[];
}) {
  return (
    <main className="mx-auto grid w-full max-w-lg gap-8 px-4 py-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Ligas de futsal y fútbol</h1>
        <p className="text-sm text-muted-foreground">
          Tablas de posiciones, goleadores y resultados de las ligas internas del curso.
        </p>
      </div>
      <LeagueSection
        id="ligas-en-curso"
        title="Ligas en curso"
        groups={inProgress}
        emptyText="No hay ligas en curso por ahora"
      />
      <LeagueSection
        id="historial"
        title="Historial"
        groups={finalized}
        emptyText="Todavía no hay ligas finalizadas."
      />
    </main>
  );
}

function LeagueSection({
  id,
  title,
  groups,
  emptyText,
}: {
  id: string;
  title: string;
  groups: SemesterGroup[];
  emptyText: string;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        groups.map((group) => (
          <div key={group.semester} className="grid gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Semestre {group.semester}</h3>
            <ul className="grid gap-2">
              {group.leagues.map((league) => (
                <li key={league.id}>
                  <Link
                    href={`/ligas/${league.id}`}
                    className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 font-medium hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 wrap-anywhere">{league.name}</span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
