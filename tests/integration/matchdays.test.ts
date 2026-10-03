import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { deleteMatchday } from "@/server/use-cases/delete-matchday";
import { updateMatchdayDate } from "@/server/use-cases/update-matchday-date";

import {
  createGoal,
  createLeague,
  createMatchday,
  createPlayer,
  createTeam,
} from "../support/fixtures";
import { signedUpAccount } from "../support/session";

const dayOf = async (matchdayId: string) =>
  (await db.matchday.findUniqueOrThrow({ where: { id: matchdayId } })).playDate
    .toISOString()
    .slice(0, 10);

describe("cambiar el día y eliminar fechas (RF-50, RF-98, RF-99)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("cambia el día de una fecha y rechaza el de otra fecha de la liga", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    const first = await createMatchday(league.id, "2026-09-05", { finalized: true });
    await createMatchday(league.id, "2026-09-12");

    const moved = await updateMatchdayDate(
      league.id,
      first.id,
      { playDate: "2026-09-19" },
      headers,
    );
    const clash = await updateMatchdayDate(
      league.id,
      first.id,
      { playDate: "2026-09-12" },
      headers,
    );

    expect(moved).toEqual({ ok: true, data: null });
    expect(clash).toMatchObject({ ok: false, error: { code: "DUPLICATE_PLAY_DATE" } });
    expect(await dayOf(first.id)).toBe("2026-09-19");
  });

  it("elimina la fecha con sus partidos y goles", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    const tigres = await createTeam(league.id, "Tigres");
    const leones = await createTeam(league.id, "Leones");
    const scorer = await createPlayer(league.id, tigres.id, "Juan");
    const matchday = await createMatchday(league.id, "2026-09-05");
    const match = await db.match.create({
      data: {
        matchdayId: matchday.id,
        position: 1,
        teamAId: tigres.id,
        teamBId: leones.id,
        status: "FINISHED",
      },
    });
    await createGoal(match.id, tigres.id, scorer.id);

    const result = await deleteMatchday(league.id, matchday.id, headers);

    expect(result).toEqual({ ok: true, data: null });
    expect(await db.matchday.findUnique({ where: { id: matchday.id } })).toBeNull();
    expect(await db.match.count({ where: { matchdayId: matchday.id } })).toBe(0);
    expect(await db.goal.count({ where: { matchId: match.id } })).toBe(0);
    expect(await db.player.findUnique({ where: { id: scorer.id } })).not.toBeNull();
  });

  it("otro ayudante no cambia ni elimina fechas, y una fecha de otra liga no existe", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    const other = await signedUpAccount();
    const foreignLeague = await createLeague({ ownerId: other.user.id });
    const foreign = await createMatchday(foreignLeague.id, "2026-09-05");

    const forbidden = await deleteMatchday(foreignLeague.id, foreign.id, headers);
    const elsewhere = await updateMatchdayDate(
      league.id,
      foreign.id,
      { playDate: "2026-09-06" },
      headers,
    );

    expect(forbidden).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(elsewhere).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(await dayOf(foreign.id)).toBe("2026-09-05");
  });
});
