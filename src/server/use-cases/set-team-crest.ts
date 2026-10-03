import "server-only";

import { fail, ok, type Result } from "@/domain/result";
import { sessionUser } from "@/server/auth/session-user";
import { requireOwnedTeam } from "@/server/authz";
import { processCrest } from "@/server/crests/process";
import { db } from "@/server/db/client";

/** Sube o reemplaza el escudo de un equipo mientras la liga está en curso (RF-25, RF-28 a RF-30, RF-32). */
export async function setTeamCrest(
  leagueId: string,
  teamId: string,
  file: Uint8Array,
  requestHeaders: Headers,
): Promise<Result<null>> {
  const user = await sessionUser(requestHeaders);
  if (!user) return fail("UNAUTHENTICATED");
  const owned = await requireOwnedTeam(user.id, leagueId, teamId, { mustBeInProgress: true });
  if (!owned.ok) return owned;
  const crest = await processCrest(file);
  if (!crest.ok) return crest;

  const data = new Uint8Array(crest.data.data);
  await db.teamCrest.upsert({
    where: { teamId },
    create: { teamId, data, hash: crest.data.hash },
    update: { data, hash: crest.data.hash },
  });
  return ok(null);
}
