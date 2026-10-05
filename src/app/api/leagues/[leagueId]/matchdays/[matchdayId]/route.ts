import { NextResponse } from "next/server";

import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedMatchday } from "@/server/authz";
import { getMatchdayView } from "@/server/queries/matchday";

const STATUS = { UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404 } as const;

/**
 * Lectura de la vista de la fecha para TanStack Query (ADR 011). Autoriza
 * igual que los casos de uso: sesión y dueño (principio 3).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string; matchdayId: string }> },
) {
  const { leagueId, matchdayId } = await params;
  const user = await sessionUser(request.headers);
  if (!user)
    return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: STATUS.UNAUTHENTICATED });
  const owned = await requireOwnedMatchday(user.id, leagueId, matchdayId);
  if (!owned.ok) {
    const code = owned.error.code === "FORBIDDEN" ? "FORBIDDEN" : "NOT_FOUND";
    return NextResponse.json({ code }, { status: STATUS[code] });
  }

  const view = await getMatchdayView(leagueId, matchdayId);
  return NextResponse.json(view, { headers: { "Cache-Control": "private, no-store" } });
}
