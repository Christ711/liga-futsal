import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { deleteAccount } from "@/server/use-cases/delete-account";

import { createLeague, createPlayer, createTeam } from "../support/fixtures";

/** Crea una cuenta real y devuelve las cabeceras de una petición con su sesión. */
async function signedUpAccount() {
  const email = `ayudante-${crypto.randomUUID()}@example.com`;
  const body = {
    email,
    password: "contraseña-segura",
    name: "",
    inviteCode: process.env.INVITE_CODE!,
  };
  const response = await auth.api.signUpEmail({ body, asResponse: true });
  const cookie = response.headers.get("set-cookie")!.split(";")[0]!;
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  return { user, headers: new Headers({ cookie }) };
}

/** Liga con todos sus datos: equipos con escudo, jugadores, fecha, partido, gol con autor, descuento y snapshot. */
async function createFullLeague(ownerId: string) {
  const league = await createLeague({ ownerId });
  const teamA = await createTeam(league.id);
  const teamB = await createTeam(league.id);
  await db.teamCrest.create({ data: { teamId: teamA.id, data: Buffer.from([0]), hash: "h" } });
  const scorer = await createPlayer(league.id, teamA.id);
  const matchday = await db.matchday.create({
    data: { leagueId: league.id, playDate: new Date("2026-10-01") },
  });
  const match = await db.match.create({
    data: { matchdayId: matchday.id, position: 1, teamAId: teamA.id, teamBId: teamB.id },
  });
  await db.goal.create({ data: { matchId: match.id, teamId: teamA.id, scorerId: scorer.id } });
  await db.pointDeduction.create({ data: { teamId: teamB.id, points: 1, reason: "Tarjetas" } });
  await db.leagueSnapshot.create({ data: { leagueId: league.id, standings: [], topScorers: [] } });
  return league;
}

describe("deleteAccount (RF-92)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("borra la cuenta, sus sesiones y sus ligas con todos sus datos, sin tocar las de otros", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createFullLeague(user.id);
    const otherLeague = await createFullLeague((await signedUpAccount()).user.id);
    await db.loginFailure.create({ data: { email: user.email } });

    const result = await deleteAccount(headers);

    expect(result).toEqual({ ok: true, data: null });
    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.account.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.league.findUnique({ where: { id: league.id } })).toBeNull();
    expect(await db.team.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.matchday.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.loginFailure.count({ where: { email: user.email } })).toBe(0);
    expect(await db.league.findUnique({ where: { id: otherLeague.id } })).not.toBeNull();
    expect(await db.goal.count({ where: { team: { leagueId: otherLeague.id } } })).toBe(1);
  });

  it("sin sesión no borra nada", async () => {
    const result = await deleteAccount(new Headers());

    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });
});
