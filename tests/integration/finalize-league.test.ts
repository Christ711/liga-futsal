import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { getPublicLeague } from "@/server/queries/public-league";
import { createTeam as createTeamUseCase } from "@/server/use-cases/create-team";
import { finalizeLeague } from "@/server/use-cases/finalize-league";
import { updateTeam } from "@/server/use-cases/update-team";

import {
  createGoal,
  createLeague,
  createMatch,
  createMatchday,
  createPlayer,
  createTeam,
} from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function playedLeague() {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const tigres = await createTeam(league.id, "Tigres");
  const leones = await createTeam(league.id, "Leones");
  await db.teamCrest.create({ data: { teamId: tigres.id, data: Buffer.from([0]), hash: "h" } });
  const juan = await createPlayer(league.id, tigres.id, "Juan");
  const matchday = await createMatchday(league.id, "2026-09-05", { finalized: true });
  const finished = await createMatch(matchday.id, tigres.id, leones.id, {
    finished: true,
    locked: true,
  });
  await createGoal(finished.id, tigres.id, juan.id);
  const pending = await createMatch(matchday.id, leones.id, tigres.id, { position: 2 });
  await createGoal(pending.id, leones.id, null);
  await db.pointDeduction.create({ data: { teamId: leones.id, points: 2, reason: "Atraso" } });
  return { ...account, league, tigres, leones, juan, matchday };
}

describe("finalizeLeague (RF-74 a RF-77)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("guarda las tablas finales y borra fechas, partidos, goles y descuentos", async () => {
    const { league, tigres, leones, juan, matchday, headers } = await playedLeague();

    const result = await finalizeLeague(league.id, headers);

    expect(result).toEqual({ ok: true, data: null });
    const stored = await db.league.findUniqueOrThrow({
      where: { id: league.id },
      include: { snapshot: true },
    });
    expect(stored.status).toBe("FINALIZED");
    expect(stored.finalizedAt).not.toBeNull();
    const standings = stored.snapshot!.standings as { teamName: string; points: number }[];
    expect(standings.map((row) => [row.teamName, row.points])).toEqual([
      ["Tigres", 3],
      ["Leones", -2],
    ]);
    expect(stored.snapshot!.topScorers).toEqual([
      expect.objectContaining({ playerName: "Juan", teamName: "Tigres", goals: 1 }),
    ]);
    expect(await db.matchday.count({ where: { id: matchday.id } })).toBe(0);
    expect(await db.match.count({ where: { matchdayId: matchday.id } })).toBe(0);
    expect(await db.goal.count({ where: { scorerId: juan.id } })).toBe(0);
    expect(await db.pointDeduction.count({ where: { teamId: leones.id } })).toBe(0);
    // Equipos, escudos y jugadores se conservan (RF-74).
    expect(await db.team.count({ where: { leagueId: league.id } })).toBe(2);
    expect(await db.teamCrest.count({ where: { teamId: tigres.id } })).toBe(1);
    expect(await db.player.count({ where: { id: juan.id } })).toBe(1);
  });

  it("la vista pública de la liga finalizada lee el snapshot validado", async () => {
    const { league, headers } = await playedLeague();
    await finalizeLeague(league.id, headers);

    const view = await getPublicLeague(league.id);

    expect(view?.status).toBe("finalized");
    expect(view && view.status === "finalized" && view.snapshot.standings).toHaveLength(2);
  });

  it("finaliza una liga sin fechas, que queda con sus tablas en cero (RF-77)", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeague({ ownerId: user.id });
    await createTeam(league.id, "Tigres");

    const result = await finalizeLeague(league.id, headers);

    expect(result).toEqual({ ok: true, data: null });
    const snapshot = await db.leagueSnapshot.findUniqueOrThrow({ where: { leagueId: league.id } });
    expect(snapshot.standings).toEqual([expect.objectContaining({ played: 0, points: 0 })]);
    expect(snapshot.topScorers).toEqual([]);
  });

  it("después de finalizar rechaza cualquier edición y volver a finalizar (RF-76)", async () => {
    const { league, tigres, headers } = await playedLeague();
    await finalizeLeague(league.id, headers);

    const results = [
      await finalizeLeague(league.id, headers),
      await updateTeam(league.id, tigres.id, { name: "Otro" }, headers),
      await createTeamUseCase(league.id, { name: "Pumas" }, headers),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
    }
  });

  it("otro ayudante no finaliza ligas ajenas", async () => {
    const { league } = await playedLeague();
    const { headers } = await signedUpAccount();

    const result = await finalizeLeague(league.id, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect((await db.league.findUniqueOrThrow({ where: { id: league.id } })).status).toBe(
      "IN_PROGRESS",
    );
  });
});
