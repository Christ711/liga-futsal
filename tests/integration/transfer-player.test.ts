import { afterAll, describe, expect, it } from "vitest";

import { matchScore } from "@/domain/matches";
import { computeTopScorers } from "@/domain/standings";
import { db } from "@/server/db/client";
import { transferPlayer } from "@/server/use-cases/transfer-player";

import {
  createFinishedMatch,
  createGoal,
  createLeague,
  createPlayer,
  createTeam,
} from "../support/fixtures";
import { signedUpAccount } from "../support/session";

/** Partidos de la liga en el formato del dominio, leídos de la base. */
async function leagueMatches(leagueId: string) {
  const matches = await db.match.findMany({
    where: { matchday: { leagueId } },
    include: { goals: { select: { teamId: true, scorerId: true } } },
  });
  return matches.map((match) => ({
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    goals: match.goals,
    status: "finished" as const,
    locked: match.locked,
  }));
}

describe("transferPlayer (RF-39, RF-40)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("mueve al jugador sin cambiar sus goles ni el marcador de los partidos jugados", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    const tigres = await createTeam(league.id, "Tigres");
    const leones = await createTeam(league.id, "Leones");
    const juan = await createPlayer(league.id, tigres.id, "Juan");
    const pedro = await createPlayer(league.id, leones.id, "Pedro");
    const match = await createFinishedMatch(league.id, tigres.id, leones.id);
    await createGoal(match.id, tigres.id, juan.id);
    await createGoal(match.id, tigres.id, juan.id);
    await createGoal(match.id, leones.id, pedro.id);
    const other = await createFinishedMatch(league.id, tigres.id, leones.id);
    await createGoal(other.id, tigres.id, juan.id);

    const result = await transferPlayer(league.id, juan.id, { teamId: leones.id }, headers);

    expect(result).toEqual({ ok: true, data: null });
    expect(await db.player.findUniqueOrThrow({ where: { id: juan.id } })).toMatchObject({
      teamId: leones.id,
    });
    const matches = await leagueMatches(league.id);
    const first = matches.find((candidate) => candidate.goals.length === 3)!;
    expect(matchScore(first)).toEqual({ teamA: 2, teamB: 1 });
    const scorers = computeTopScorers({
      teams: [
        { id: tigres.id, name: "Tigres" },
        { id: leones.id, name: "Leones" },
      ],
      players: (await db.player.findMany({ where: { leagueId: league.id } })).map((player) => ({
        id: player.id,
        name: player.name,
        teamId: player.teamId,
      })),
      matches,
    });
    expect(scorers[0]).toMatchObject({ playerName: "Juan", goals: 3 });
  });

  it("rechaza un equipo de destino de otra liga", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    const team = await createTeam(league.id);
    const player = await createPlayer(league.id, team.id);
    const otherLeague = await createLeague({ ownerId: user.id });
    const foreign = await createTeam(otherLeague.id);

    const result = await transferPlayer(league.id, player.id, { teamId: foreign.id }, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect((await db.player.findUniqueOrThrow({ where: { id: player.id } })).teamId).toBe(team.id);
  });

  it("no traspasa en una liga finalizada (RF-76)", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    const team = await createTeam(league.id);
    const target = await createTeam(league.id);
    const player = await createPlayer(league.id, team.id);
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });

    const result = await transferPlayer(league.id, player.id, { teamId: target.id }, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
  });
});
