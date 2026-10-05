import { NextResponse } from "next/server";

import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedLeague } from "@/server/authz";
import { getLeagueTables } from "@/server/queries/tables";

/**
 * Tablas de la liga para la vista de la fecha (RF-61; ADR 011). Autoriza igual
 * que los casos de uso: sesión y dueño (principio 3).
 */
export async function GET(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const user = await sessionUser(request.headers);
  if (!user) return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
  const owned = await requireOwnedLeague(user.id, leagueId);
  if (!owned.ok) {
    const forbidden = owned.error.code === "FORBIDDEN";
    return NextResponse.json(
      { code: forbidden ? "FORBIDDEN" : "NOT_FOUND" },
      { status: forbidden ? 403 : 404 },
    );
  }

  return NextResponse.json(await getLeagueTables(leagueId), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
