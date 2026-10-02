import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";

import { createLeague, createPlayer, createTeam } from "../support/fixtures";

const UNIQUE_VIOLATION = { code: "P2002" };

async function leagueWithMatch() {
  const league = await createLeague();
  const tigres = await createTeam(league.id);
  const leones = await createTeam(league.id);
  const juan = await createPlayer(league.id, tigres.id);
  const matchday = await db.matchday.create({
    data: { leagueId: league.id, playDate: new Date("2026-09-10") },
  });
  const match = await db.match.create({
    data: { matchdayId: matchday.id, position: 1, teamAId: tigres.id, teamBId: leones.id },
  });
  return { league, tigres, leones, juan, matchday, match };
}

describe("esquema de fechas, partidos, goles, descuentos, snapshot e intentos fallidos", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("un partido nace pendiente y sin bloquear, y una fecha nace sin finalizar", async () => {
    const { match, matchday } = await leagueWithMatch();

    expect(match.status).toBe("PENDING");
    expect(match.locked).toBe(false);
    expect(matchday.finalizedAt).toBeNull();
  });

  it("rechaza dos fechas con el mismo día de juego en una liga (RF-99)", async () => {
    const { league } = await leagueWithMatch();

    await expect(
      db.matchday.create({ data: { leagueId: league.id, playDate: new Date("2026-09-10") } }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);
  });

  it("permite el mismo día de juego en ligas distintas (RF-99)", async () => {
    await leagueWithMatch();

    await expect(leagueWithMatch()).resolves.toBeDefined();
  });

  it("guarda el día de juego como fecha de calendario, sin hora", async () => {
    const { matchday } = await leagueWithMatch();

    const [row] = await db.$queryRaw<{ day: string }[]>`
      SELECT "playDate"::text AS day FROM matchday WHERE id = ${matchday.id}`;
    expect(row?.day).toBe("2026-09-10");
  });

  it("no deja borrar un jugador con goles registrados (RF-37)", async () => {
    const { match, tigres, juan } = await leagueWithMatch();
    await db.goal.create({ data: { matchId: match.id, teamId: tigres.id, scorerId: juan.id } });

    await expect(db.player.delete({ where: { id: juan.id } })).rejects.toThrow();
    expect(await db.player.count({ where: { id: juan.id } })).toBe(1);
  });

  it("deja borrar un jugador sin goles (RF-38)", async () => {
    const { juan } = await leagueWithMatch();

    await db.player.delete({ where: { id: juan.id } });

    expect(await db.player.count({ where: { id: juan.id } })).toBe(0);
  });

  it("un gol guarda el equipo al que suma y admite no tener autor (RF-40, RF-56)", async () => {
    const { match, tigres, leones, juan } = await leagueWithMatch();
    await db.goal.create({ data: { matchId: match.id, teamId: tigres.id, scorerId: juan.id } });
    const withoutScorer = await db.goal.create({ data: { matchId: match.id, teamId: leones.id } });

    // Traspaso: Juan pasa a leones; su gol sigue sumando a tigres.
    await db.player.update({ where: { id: juan.id }, data: { teamId: leones.id } });

    const goals = await db.goal.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "asc" },
    });
    expect(goals.map((goal) => goal.teamId)).toEqual([tigres.id, leones.id]);
    expect(withoutScorer.scorerId).toBeNull();
  });

  it("borrar una fecha borra sus partidos y goles (RF-50)", async () => {
    const { matchday, match, tigres, juan } = await leagueWithMatch();
    await db.goal.create({ data: { matchId: match.id, teamId: tigres.id, scorerId: juan.id } });

    await db.matchday.delete({ where: { id: matchday.id } });

    expect(await db.match.count({ where: { matchdayId: matchday.id } })).toBe(0);
    expect(await db.goal.count({ where: { matchId: match.id } })).toBe(0);
    expect(await db.player.count({ where: { id: juan.id } })).toBe(1);
  });

  it("borrar una liga con jugadores que tienen goles borra todo (RF-79)", async () => {
    const { league, match, tigres, juan } = await leagueWithMatch();
    await db.goal.create({ data: { matchId: match.id, teamId: tigres.id, scorerId: juan.id } });
    await db.pointDeduction.create({ data: { teamId: tigres.id, points: 2, reason: "Conducta" } });

    await db.league.delete({ where: { id: league.id } });

    expect(await db.team.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.player.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.matchday.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.goal.count({ where: { matchId: match.id } })).toBe(0);
    expect(await db.pointDeduction.count({ where: { teamId: tigres.id } })).toBe(0);
  });

  it("guarda el snapshot de una liga como JSON y lo borra con ella", async () => {
    const { league } = await leagueWithMatch();
    await db.leagueSnapshot.create({
      data: { leagueId: league.id, standings: [{ teamName: "Tigres", points: 7 }], topScorers: [] },
    });

    const snapshot = await db.leagueSnapshot.findUniqueOrThrow({ where: { leagueId: league.id } });
    expect(snapshot.standings).toEqual([{ teamName: "Tigres", points: 7 }]);

    await db.league.delete({ where: { id: league.id } });
    expect(await db.leagueSnapshot.count({ where: { leagueId: league.id } })).toBe(0);
  });

  it("registra intentos fallidos de inicio de sesión por correo (RF-7)", async () => {
    const email = `bloqueado-${crypto.randomUUID()}@example.com`;
    await db.loginFailure.createMany({ data: [{ email }, { email }] });

    expect(await db.loginFailure.count({ where: { email } })).toBe(2);
  });
});
