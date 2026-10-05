import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { MatchdayStatusBadge } from "@/components/matchday/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MIN_TEAMS_FOR_MATCHDAY } from "@/domain/league-rules";
import { formatDay } from "@/lib/dates";
import { getLeagueAdmin } from "@/server/queries/league-admin";

import { CopyLinkButton } from "./copy-link-button";
import { loadOwnedLeague } from "./owned-league";

type Props = { params: Promise<{ leagueId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await loadOwnedLeague((await params).leagueId);
  return { title: `${league.name} - Liga Futsal` };
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Origen de la petición, para armar el link público completo. */
async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

/** Resumen de la liga: su estado y lo más usado en la cancha a un toque (plan D22). */
export default async function LeagueSummaryPage({ params }: Props) {
  const { leagueId } = await params;
  // El layout y la página se renderizan en paralelo: la página también autoriza
  // (sin consulta extra, por `cache`) antes de leer datos de la liga.
  await loadOwnedLeague(leagueId);
  const [league, origin] = await Promise.all([getLeagueAdmin(leagueId), requestOrigin()]);
  const base = `/mis-ligas/${league.id}`;
  const publicUrl = `${origin}/ligas/${league.id}`;
  const open = league.matchdays.find((matchday) => matchday.status === "open");

  return (
    <main className="mx-auto grid w-full max-w-lg gap-5 px-4 py-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold wrap-anywhere">{league.name}</h1>
        <p className="text-sm text-muted-foreground">
          Semestre {league.semester} ·{" "}
          <span className="font-medium text-foreground">
            {league.finalized ? "Finalizada" : "En curso"}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          {plural(league.teams.length, "equipo", "equipos")} ·{" "}
          {plural(league.playerCount, "jugador", "jugadores")} ·{" "}
          {plural(league.matchdays.length, "fecha", "fechas")}
        </p>
      </div>

      {league.semesterOver ? (
        <p className="flex flex-wrap items-center gap-x-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-medium">El semestre terminó</span>
          <Link href={`${base}/ajustes#finalizar-liga`} className="underline">
            Finalizar liga
          </Link>
        </p>
      ) : null}

      {league.finalized ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg">Liga finalizada</h2>
            </CardTitle>
            <CardDescription>
              Sus tablas finales y sus equipos quedaron en la página pública.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg">Fecha abierta</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {open ? (
              <>
                <div className="grid gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Fecha {open.number}</span>
                    <MatchdayStatusBadge status={open.status} pendingCount={open.pendingCount} />
                  </span>
                  <span className="text-sm text-muted-foreground first-letter:uppercase">
                    {formatDay(open.playDate)}
                  </span>
                </div>
                <Button asChild size="lg" className="h-11 w-full">
                  <Link href={`${base}/fechas/${open.id}`}>Ir a la fecha</Link>
                </Button>
              </>
            ) : league.teams.length < MIN_TEAMS_FOR_MATCHDAY ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Agrega al menos {MIN_TEAMS_FOR_MATCHDAY} equipos para generar la primera fecha.
                </p>
                <Button asChild size="lg" className="h-11 w-full">
                  <Link href={`${base}/equipos`}>Agregar equipos</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">No hay una fecha abierta.</p>
                <Button asChild size="lg" className="h-11 w-full">
                  <Link href={`${base}/fechas`}>Generar fecha</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg">Página pública</h2>
          </CardTitle>
          <CardDescription>
            Comparte este link con los alumnos: ven la tabla, los goleadores y las fechas sin
            iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Link href={`/ligas/${league.id}`} className="text-sm font-medium break-all underline">
            {publicUrl}
          </Link>
          <CopyLinkButton url={publicUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
