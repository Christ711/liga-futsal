import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { addGoal } from "@/server/use-cases/add-goal";
import { reassignGoal } from "@/server/use-cases/reassign-goal";
import { removeGoal } from "@/server/use-cases/remove-goal";
import { moveMatch } from "@/server/use-cases/reorder-matches";

import {
  createGoal,
  createLeague,
  createMatch,
  createMatchday,
  createPlayer,
  createTeam,
} from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function leagueWithMatch(options: { locked?: boolean } = {}) {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const tigres = await createTeam(league.id, "Tigres");
  const leones = await createTeam(league.id, "Leones");
  const pumas = await createTeam(league.id, "Pumas");
  const juan = await createPlayer(league.id, tigres.id, "Juan");
  const pedro = await createPlayer(league.id, leones.id, "Pedro");
  const ana = await createPlayer(league.id, pumas.id, "Ana");
  const matchday = await createMatchday(league.id, "2026-09-05");
  const match = await createMatch(matchday.id, tigres.id, leones.id, {
    finished: options.locked,
    locked: options.locked,
  });
  return { ...account, league, tigres, leones, pumas, juan, pedro, ana, matchday, match };
}

const goalsOf = (matchId: string) =>
  db.goal.findMany({
    where: { matchId },
    select: { teamId: true, scorerId: true },
    orderBy: { createdAt: "asc" },
  });

describe("goles de un partido (RF-53 a RF-57, RF-103)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("anota un gol de un jugador al equipo de ese jugador y un gol sin autor (RF-53, RF-56)", async () => {
    const { league, match, tigres, leones, juan, headers } = await leagueWithMatch();

    const scored = await addGoal(
      league.id,
      { matchId: match.id, teamId: tigres.id, scorerId: juan.id },
      headers,
    );
    const anonymous = await addGoal(
      league.id,
      { matchId: match.id, teamId: leones.id, scorerId: null },
      headers,
    );

    expect(scored).toEqual({ ok: true, data: null });
    expect(anonymous).toEqual({ ok: true, data: null });
    expect(await goalsOf(match.id)).toEqual([
      { teamId: tigres.id, scorerId: juan.id },
      { teamId: leones.id, scorerId: null },
    ]);
  });

  it("rechaza un autor que no es jugador actual del equipo del gol o un equipo que no juega", async () => {
    const { league, match, tigres, pumas, pedro, ana, headers } = await leagueWithMatch();

    const wrongTeam = await addGoal(
      league.id,
      { matchId: match.id, teamId: tigres.id, scorerId: pedro.id },
      headers,
    );
    const notPlaying = await addGoal(
      league.id,
      { matchId: match.id, teamId: pumas.id, scorerId: ana.id },
      headers,
    );

    expect(wrongTeam).toMatchObject({ error: { code: "SCORER_NOT_IN_TEAM" } });
    expect(notPlaying).toMatchObject({ error: { code: "TEAM_NOT_IN_MATCH" } });
    expect(await goalsOf(match.id)).toEqual([]);
  });

  it("rechaza un autor de otra liga", async () => {
    const { league, match, tigres, headers, user } = await leagueWithMatch();
    const otherLeague = await createLeague({ ownerId: user.id });
    const otherTeam = await createTeam(otherLeague.id);
    const stranger = await createPlayer(otherLeague.id, otherTeam.id);

    const result = await addGoal(
      league.id,
      { matchId: match.id, teamId: tigres.id, scorerId: stranger.id },
      headers,
    );

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("quita un gol y reasigna otro al jugador del otro equipo (RF-57)", async () => {
    const { league, match, tigres, leones, juan, pedro, headers } = await leagueWithMatch();
    const removed = await createGoal(match.id, tigres.id, juan.id);
    const moved = await createGoal(match.id, tigres.id, juan.id);

    const removal = await removeGoal(league.id, removed.id, headers);
    const reassignment = await reassignGoal(
      league.id,
      moved.id,
      { teamId: leones.id, scorerId: pedro.id },
      headers,
    );

    expect(removal).toEqual({ ok: true, data: null });
    expect(reassignment).toEqual({ ok: true, data: null });
    expect(await goalsOf(match.id)).toEqual([{ teamId: leones.id, scorerId: pedro.id }]);
  });

  it("en un partido bloqueado no se agregan, quitan ni reasignan goles (RF-103)", async () => {
    const { league, match, tigres, juan, headers } = await leagueWithMatch({ locked: true });
    const goal = await createGoal(match.id, tigres.id, juan.id);

    const results = [
      await addGoal(league.id, { matchId: match.id, teamId: tigres.id, scorerId: null }, headers),
      await removeGoal(league.id, goal.id, headers),
      await reassignGoal(league.id, goal.id, { teamId: tigres.id, scorerId: null }, headers),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, error: { code: "MATCH_LOCKED" } });
    }
    expect(await goalsOf(match.id)).toEqual([{ teamId: tigres.id, scorerId: juan.id }]);
  });

  it("otro ayudante no toca goles de partidos ajenos (RF-13)", async () => {
    const { league, match, tigres, juan } = await leagueWithMatch();
    const goal = await createGoal(match.id, tigres.id, juan.id);
    const { headers } = await signedUpAccount();

    const results = [
      await addGoal(league.id, { matchId: match.id, teamId: tigres.id, scorerId: null }, headers),
      await removeGoal(league.id, goal.id, headers),
      await moveMatch(league.id, match.id, "down", headers),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    }
  });
});

describe("reordenar partidos (RF-46)", () => {
  it("sube un partido una posición intercambiándolo con el anterior", async () => {
    const { league, matchday, match, tigres, pumas, leones, headers } = await leagueWithMatch();
    const second = await createMatch(matchday.id, leones.id, pumas.id, { position: 2 });
    const third = await createMatch(matchday.id, tigres.id, pumas.id, { position: 3 });

    const up = await moveMatch(league.id, third.id, "up", headers);
    const firstUp = await moveMatch(league.id, match.id, "up", headers);

    expect(up).toEqual({ ok: true, data: null });
    // El primero no puede subir más: no cambia nada.
    expect(firstUp).toEqual({ ok: true, data: null });
    const order = await db.match.findMany({
      where: { matchdayId: matchday.id },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    expect(order).toEqual([
      { id: match.id, position: 1 },
      { id: third.id, position: 2 },
      { id: second.id, position: 3 },
    ]);
  });
});
