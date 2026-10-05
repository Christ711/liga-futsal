import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { getLeagueTables } from "@/server/queries/tables";
import { finishMatch } from "@/server/use-cases/finish-match";
import { reassignGoal } from "@/server/use-cases/reassign-goal";
import { removeGoal } from "@/server/use-cases/remove-goal";
import { revertMatch } from "@/server/use-cases/revert-match";

import {
  createGoal,
  createLeague,
  createMatch,
  createMatchday,
  createPlayer,
  createTeam,
} from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function leagueWithMatch() {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const tigres = await createTeam(league.id, "Tigres");
  const leones = await createTeam(league.id, "Leones");
  const juan = await createPlayer(league.id, tigres.id, "Juan");
  const matchday = await createMatchday(league.id, "2026-09-05");
  const match = await createMatch(matchday.id, tigres.id, leones.id);
  return { ...account, league, tigres, leones, juan, match };
}

const rowOf = (tables: Awaited<ReturnType<typeof getLeagueTables>>, teamName: string) =>
  tables.standings.find((row) => row.teamName === teamName)!;

describe("terminar y devolver a pendiente un partido (RF-58 a RF-60, RF-84)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("un partido pendiente no cuenta en las tablas (RF-59)", async () => {
    const { league, tigres, juan, match } = await leagueWithMatch();
    await createGoal(match.id, tigres.id, juan.id);

    const tables = await getLeagueTables(league.id);

    expect(rowOf(tables, "Tigres")).toMatchObject({ played: 0, points: 0 });
    expect(tables.topScorers).toEqual([]);
  });

  it("terminar un 0-0 lo cuenta como empate en la tabla (RF-58)", async () => {
    const { league, match, headers } = await leagueWithMatch();

    const result = await finishMatch(league.id, match.id, headers);

    expect(result).toEqual({ ok: true, data: null });
    const tables = await getLeagueTables(league.id);
    expect(rowOf(tables, "Tigres")).toMatchObject({ played: 1, drawn: 1, points: 1 });
    expect(rowOf(tables, "Leones")).toMatchObject({ played: 1, drawn: 1, points: 1 });
  });

  it("terminado con goles, la tabla y los goleadores lo cuentan (RF-60)", async () => {
    const { league, tigres, juan, match, headers } = await leagueWithMatch();
    await createGoal(match.id, tigres.id, juan.id);
    await createGoal(match.id, tigres.id, null);

    await finishMatch(league.id, match.id, headers);

    const tables = await getLeagueTables(league.id);
    expect(rowOf(tables, "Tigres")).toMatchObject({ won: 1, goalsFor: 2, points: 3 });
    expect(rowOf(tables, "Leones")).toMatchObject({ lost: 1, goalsAgainst: 2, points: 0 });
    // El "Gol sin autor" suma al marcador pero no a los goleadores (RF-56).
    expect(tables.topScorers).toEqual([expect.objectContaining({ playerName: "Juan", goals: 1 })]);
  });

  it("modificar un gol de un partido terminado no bloqueado recalcula ambas tablas (RF-60)", async () => {
    const { league, tigres, leones, juan, match, headers } = await leagueWithMatch();
    const pedro = await createPlayer(league.id, leones.id, "Pedro");
    const removed = await createGoal(match.id, tigres.id, juan.id);
    const moved = await createGoal(match.id, tigres.id, juan.id);
    await finishMatch(league.id, match.id, headers);
    const before = await getLeagueTables(league.id);
    expect(rowOf(before, "Tigres")).toMatchObject({ won: 1, points: 3 });

    await removeGoal(league.id, removed.id, headers);
    await reassignGoal(league.id, moved.id, { teamId: leones.id, scorerId: pedro.id }, headers);

    const after = await getLeagueTables(league.id);
    expect(rowOf(after, "Tigres")).toMatchObject({ won: 0, lost: 1, goalsFor: 0, points: 0 });
    expect(rowOf(after, "Leones")).toMatchObject({ won: 1, goalsFor: 1, points: 3 });
    expect(after.topScorers).toEqual([
      expect.objectContaining({ playerName: "Pedro", teamName: "Leones", goals: 1 }),
    ]);
  });

  it("devolverlo a pendiente lo excluye de las tablas y conserva sus goles (RF-84)", async () => {
    const { league, tigres, juan, match, headers } = await leagueWithMatch();
    await createGoal(match.id, tigres.id, juan.id);
    await finishMatch(league.id, match.id, headers);

    const result = await revertMatch(league.id, match.id, headers);

    expect(result).toEqual({ ok: true, data: null });
    const tables = await getLeagueTables(league.id);
    expect(rowOf(tables, "Tigres")).toMatchObject({ played: 0, points: 0 });
    expect(tables.topScorers).toEqual([]);
    expect(await db.goal.count({ where: { matchId: match.id } })).toBe(1);
  });

  it("los descuentos restan puntos en la tabla calculada (RF-64)", async () => {
    const { league, tigres, match, headers } = await leagueWithMatch();
    await db.pointDeduction.create({ data: { teamId: tigres.id, points: 2, reason: "Atraso" } });
    await finishMatch(league.id, match.id, headers);

    const tables = await getLeagueTables(league.id);

    expect(rowOf(tables, "Tigres")).toMatchObject({
      points: -1,
      deductions: [{ points: 2, reason: "Atraso" }],
    });
  });

  it("rechaza terminar dos veces, devolver uno pendiente y tocar uno bloqueado (RF-103)", async () => {
    const { league, tigres, leones, match, headers } = await leagueWithMatch();
    const matchday = await createMatchday(league.id, "2026-09-12");
    const locked = await createMatch(matchday.id, tigres.id, leones.id, {
      finished: true,
      locked: true,
    });
    await finishMatch(league.id, match.id, headers);

    expect(await finishMatch(league.id, match.id, headers)).toMatchObject({
      error: { code: "MATCH_ALREADY_FINISHED" },
    });
    await revertMatch(league.id, match.id, headers);
    expect(await revertMatch(league.id, match.id, headers)).toMatchObject({
      error: { code: "MATCH_NOT_FINISHED" },
    });
    expect(await revertMatch(league.id, locked.id, headers)).toMatchObject({
      error: { code: "MATCH_LOCKED" },
    });
  });

  it("otro ayudante no termina partidos ajenos", async () => {
    const { league, match } = await leagueWithMatch();
    const { headers } = await signedUpAccount();

    const result = await finishMatch(league.id, match.id, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect((await db.match.findUniqueOrThrow({ where: { id: match.id } })).status).toBe("PENDING");
  });
});
