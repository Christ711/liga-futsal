import "server-only";

import { db } from "@/server/db/client";

/** Bytes del escudo de un equipo, solo si la versión pedida es la vigente (ADR 007). */
export async function getCrest(teamId: string, hash: string) {
  const crest = await db.teamCrest.findUnique({
    where: { teamId },
    select: { data: true, hash: true },
  });
  return crest?.hash === hash ? crest.data : null;
}
