import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { requireOwnedLeague } from "@/server/authz";
import { requireSession } from "@/server/auth/session";

/**
 * Liga de la URL, solo para su dueño: si no existe responde 404 y si es de otro
 * ayudante lo lleva a la vista pública (RF-13, RF-93). Con `cache`, el layout y
 * la página comparten una sola consulta por petición.
 */
export const loadOwnedLeague = cache(async (leagueId: string) => {
  const session = await requireSession();
  const league = await requireOwnedLeague(session.user.id, leagueId);
  if (!league.ok) {
    if (league.error.code === "FORBIDDEN") redirect(`/ligas/${leagueId}`);
    notFound();
  }
  return league.data;
});
