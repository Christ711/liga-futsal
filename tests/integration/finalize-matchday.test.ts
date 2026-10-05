import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { addGoal } from "@/server/use-cases/add-goal";
import { finalizeMatchday } from "@/server/use-cases/finalize-matchday";
import { finishMatch } from "@/server/use-cases/finish-match";
import { generateMatchday } from "@/server/use-cases/generate-matchday";

import { createLeague, createMatch, createMatchday, createTeam } from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function matchdayWithMatches() {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const tigres = await createTeam(league.id, "Tigres");
  const leones = await createTeam(league.id, "Leones");
  const pumas = await createTeam(league.id, "Pumas");
  const matchday = await createMatchday(league.id, "2026-09-05");
  const finished = await createMatch(matchday.id, tigres.id, leones.id, { finished: true });
  const pending = await createMatch(matchday.id, leones.id, pumas.id, { position: 2 });
  return { ...account, league, tigres, matchday, finished, pending };
}

const matchOf = (id: string) => db.match.findUniqueOrThrow({ where: { id } });

describe("finalizeMatchday (RF-49, RF-101 a RF-105)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("bloquea los terminados, deja libres los pendientes y marca la fecha como finalizada", async () => {
    const { league, matchday, finished, pending, headers } = await matchdayWithMatches();

    const result = await finalizeMatchday(league.id, matchday.id, headers);

    expect(result).toEqual({ ok: true, data: null });
    expect((await matchOf(finished.id)).locked).toBe(true);
    expect((await matchOf(pending.id)).locked).toBe(false);
    expect(
      (await db.matchday.findUniqueOrThrow({ where: { id: matchday.id } })).finalizedAt,
    ).not.toBeNull();
  });

  it("una fecha incompleta permite jugar sus pendientes, generar otra y volver a finalizarse (RF-49)", async () => {
    const { league, tigres, matchday, finished, pending, headers } = await matchdayWithMatches();
    await finalizeMatchday(league.id, matchday.id, headers);

    const goal = await addGoal(
      league.id,
      { matchId: pending.id, teamId: (await matchOf(pending.id)).teamAId, scorerId: null },
      headers,
    );
    const lockedGoal = await addGoal(
      league.id,
      { matchId: finished.id, teamId: tigres.id, scorerId: null },
      headers,
    );
    const next = await generateMatchday(league.id, { playDate: "2026-09-12" }, headers);
    await finishMatch(league.id, pending.id, headers);
    const again = await finalizeMatchday(league.id, matchday.id, headers);
    const already = await finalizeMatchday(league.id, matchday.id, headers);

    expect(goal).toEqual({ ok: true, data: null });
    expect(lockedGoal).toMatchObject({ error: { code: "MATCH_LOCKED" } });
    expect(next.ok).toBe(true);
    expect(again).toEqual({ ok: true, data: null });
    expect((await matchOf(pending.id)).locked).toBe(true);
    expect(already).toMatchObject({ error: { code: "MATCHDAY_ALREADY_FINALIZED" } });
  });

  it("otro ayudante no finaliza fechas ajenas", async () => {
    const { league, matchday, finished } = await matchdayWithMatches();
    const { headers } = await signedUpAccount();

    const result = await finalizeMatchday(league.id, matchday.id, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect((await matchOf(finished.id)).locked).toBe(false);
  });
});
