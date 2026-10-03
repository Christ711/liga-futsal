import "server-only";

import { db } from "@/server/db/client";

export type AccountSummary = {
  email: string;
  leagues: { inProgress: number; finalized: number };
};

/** Datos de la vista de la propia cuenta; el correo solo se muestra a su titular (RF-14, RF-91). */
export async function getAccountSummary(userId: string): Promise<AccountSummary> {
  const [user, counts] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }),
    db.league.groupBy({ by: ["status"], where: { ownerId: userId }, _count: true }),
  ]);
  const count = (status: "IN_PROGRESS" | "FINALIZED") =>
    counts.find((row) => row.status === status)?._count ?? 0;
  return {
    email: user.email,
    leagues: { inProgress: count("IN_PROGRESS"), finalized: count("FINALIZED") },
  };
}
