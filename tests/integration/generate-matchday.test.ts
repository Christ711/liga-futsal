import { afterAll, describe, expect, it } from "vitest";

import { countConsecutiveRepeats, roundRobinPairs } from "@/domain/scheduling";
import { db } from "@/server/db/client";
import { generateMatchday } from "@/server/use-cases/generate-matchday";

import { createLeague, createMatchday, createTeam } from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function ownLeague(teamCount: number) {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const teams = [];
  for (let index = 0; index < teamCount; index++) {
    teams.push(await createTeam(league.id, `Equipo ${index + 1}`));
  }
  return { ...account, league, teams };
}

const pairKey = (match: { teamAId: string; teamBId: string }) =>
  [match.teamAId, match.teamBId].sort().join("|");

async function matchesOf(matchdayId: string) {
  return db.match.findMany({ where: { matchdayId }, orderBy: { position: "asc" } });
}

describe("generateMatchday (RF-41, RF-42, RF-44, RF-45, RF-99, RF-100)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("crea un partido pendiente por cada par de equipos, en orden y sin consecutivos con 5 equipos", async () => {
    const { league, teams, headers } = await ownLeague(5);

    const result = await generateMatchday(league.id, { playDate: "2026-09-05" }, headers);

    expect(result.ok).toBe(true);
    const matchday = await db.matchday.findFirstOrThrow({ where: { leagueId: league.id } });
    expect(matchday.playDate.toISOString().slice(0, 10)).toBe("2026-09-05");
    expect(matchday.finalizedAt).toBeNull();
    const matches = await matchesOf(matchday.id);
    expect(matches.map((match) => match.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(matches.every((match) => match.status === "PENDING" && !match.locked)).toBe(true);
    expect(new Set(matches.map(pairKey))).toEqual(
      new Set(roundRobinPairs(teams.map((team) => team.id)).map(pairKey)),
    );
    expect(countConsecutiveRepeats(matches)).toBe(0);
  });

  it("su primer partido no repite el que abrió la fecha anterior, con su orden final (RF-45)", async () => {
    const { league, teams, headers } = await ownLeague(3);
    const previous = await createMatchday(league.id, "2026-09-05", { finalized: true });
    // Orden final de la fecha anterior: el par 1-2 quedó primero.
    await db.match.createMany({
      data: [
        { matchdayId: previous.id, position: 1, teamAId: teams[0]!.id, teamBId: teams[1]!.id },
        { matchdayId: previous.id, position: 2, teamAId: teams[1]!.id, teamBId: teams[2]!.id },
        { matchdayId: previous.id, position: 3, teamAId: teams[0]!.id, teamBId: teams[2]!.id },
      ],
    });

    for (const [index, day] of ["2026-09-12", "2026-09-19", "2026-09-26"].entries()) {
      if (index > 0) {
        await db.matchday.updateMany({
          where: { leagueId: league.id },
          data: { finalizedAt: new Date() },
        });
      }
      const result = await generateMatchday(league.id, { playDate: day }, headers);
      expect(result.ok).toBe(true);
    }

    const matchdays = await db.matchday.findMany({
      where: { leagueId: league.id },
      orderBy: { playDate: "asc" },
      include: { matches: { orderBy: { position: "asc" }, take: 1 } },
    });
    for (let index = 1; index < matchdays.length; index++) {
      expect(pairKey(matchdays[index]!.matches[0]!)).not.toBe(
        pairKey(matchdays[index - 1]!.matches[0]!),
      );
    }
  });

  it("rechaza generar con menos de 3 equipos (RF-41)", async () => {
    const { league, headers } = await ownLeague(2);

    const result = await generateMatchday(league.id, { playDate: "2026-09-05" }, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_ENOUGH_TEAMS" } });
    expect(await db.matchday.count({ where: { leagueId: league.id } })).toBe(0);
  });

  it("rechaza generar mientras hay una fecha abierta (RF-100)", async () => {
    const { league, headers } = await ownLeague(3);
    await createMatchday(league.id, "2026-09-05");

    const result = await generateMatchday(league.id, { playDate: "2026-09-12" }, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "MATCHDAY_OPEN" } });
  });

  it("permite generar si la fecha anterior quedó incompleta (RF-49)", async () => {
    const { league, teams, headers } = await ownLeague(3);
    const incomplete = await createMatchday(league.id, "2026-09-05", { finalized: true });
    await db.match.create({
      data: {
        matchdayId: incomplete.id,
        position: 1,
        teamAId: teams[0]!.id,
        teamBId: teams[1]!.id,
      },
    });

    const result = await generateMatchday(league.id, { playDate: "2026-09-12" }, headers);

    expect(result.ok).toBe(true);
  });

  it("rechaza un día que ya tiene otra fecha de la liga (RF-99)", async () => {
    const { league, headers } = await ownLeague(3);
    await createMatchday(league.id, "2026-09-05", { finalized: true });

    const result = await generateMatchday(league.id, { playDate: "2026-09-05" }, headers);

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "DUPLICATE_PLAY_DATE",
        fields: { playDate: "Ya hay una fecha de la liga ese día." },
      },
    });
  });

  it("dos generaciones simultáneas dejan una sola fecha abierta (RF-100)", async () => {
    const { league, headers } = await ownLeague(4);

    const results = await Promise.all([
      generateMatchday(league.id, { playDate: "2026-09-05" }, headers),
      generateMatchday(league.id, { playDate: "2026-09-12" }, headers),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(await db.matchday.count({ where: { leagueId: league.id } })).toBe(1);
  });

  it("otro ayudante no genera fechas y una liga finalizada tampoco (RF-13, RF-76)", async () => {
    const { league } = await ownLeague(3);
    const { headers } = await signedUpAccount();
    const owner = await ownLeague(3);
    await db.league.update({ where: { id: owner.league.id }, data: { status: "FINALIZED" } });

    const foreign = await generateMatchday(league.id, { playDate: "2026-09-05" }, headers);
    const finalized = await generateMatchday(
      owner.league.id,
      { playDate: "2026-09-05" },
      owner.headers,
    );

    expect(foreign).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(finalized).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
  });
});
