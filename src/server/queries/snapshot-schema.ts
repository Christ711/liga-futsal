import "server-only";

import { z } from "zod";

import type { LeagueSnapshot } from "@/domain/snapshot";

/**
 * Esquema del snapshot guardado como JSON (plan D7). Se valida al leer: si los
 * datos guardados no coinciden con lo que la vista espera, falla con un error
 * claro en vez de mostrar una tabla rota.
 */
const standingsRow = z.object({
  teamId: z.string(),
  teamName: z.string(),
  position: z.number().int(),
  played: z.number().int(),
  won: z.number().int(),
  drawn: z.number().int(),
  lost: z.number().int(),
  goalsFor: z.number().int(),
  goalsAgainst: z.number().int(),
  goalDifference: z.number().int(),
  points: z.number().int(),
  deductions: z.array(z.object({ points: z.number().int(), reason: z.string() })),
});

const topScorerRow = z.object({
  position: z.number().int(),
  playerId: z.string(),
  playerName: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  goals: z.number().int(),
});

const snapshotSchema = z.object({
  standings: z.array(standingsRow),
  topScorers: z.array(topScorerRow),
});

export function parseSnapshot(stored: { standings: unknown; topScorers: unknown }): LeagueSnapshot {
  return snapshotSchema.parse(stored);
}
