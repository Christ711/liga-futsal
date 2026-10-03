import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { createPlayer } from "@/server/use-cases/create-player";
import { deletePlayer } from "@/server/use-cases/delete-player";
import { transferPlayer } from "@/server/use-cases/transfer-player";
import { updatePlayer } from "@/server/use-cases/update-player";

import {
  createFinishedMatch,
  createGoal,
  createLeague,
  createPlayer as createPlayerFixture,
  createTeam,
} from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function ownLeagueWithTeams() {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const tigres = await createTeam(league.id, "Tigres");
  const leones = await createTeam(league.id, "Leones");
  return { ...account, league, tigres, leones };
}

describe("casos de uso de jugadores (RF-13, RF-33 a RF-38)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("otro ayudante no puede agregar, editar, traspasar ni eliminar jugadores", async () => {
    const { league, tigres, leones } = await ownLeagueWithTeams();
    const player = await createPlayerFixture(league.id, tigres.id, "Juan");
    const { headers } = await signedUpAccount();

    const results = [
      await createPlayer(league.id, tigres.id, { name: "Pedro" }, headers),
      await updatePlayer(league.id, player.id, { name: "Juanito" }, headers),
      await transferPlayer(league.id, player.id, { teamId: leones.id }, headers),
      await deletePlayer(league.id, player.id, headers),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    }
    expect(await db.player.findMany({ where: { leagueId: league.id } })).toMatchObject([
      { name: "Juan", teamId: tigres.id },
    ]);
  });

  it("el nombre no se repite en ningún equipo de la liga (RF-35)", async () => {
    const { league, tigres, leones, headers } = await ownLeagueWithTeams();
    await createPlayerFixture(league.id, tigres.id, "Juan Pérez");

    const result = await createPlayer(league.id, leones.id, { name: " juan pérez " }, headers);

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "DUPLICATE_NAME",
        fields: { name: "Ya existe un jugador con ese nombre en la liga." },
      },
    });
  });

  it("un jugador con goles no se elimina; uno sin goles sí (RF-37, RF-38)", async () => {
    const { league, tigres, leones, headers } = await ownLeagueWithTeams();
    const scorer = await createPlayerFixture(league.id, tigres.id, "Goleador");
    const benched = await createPlayerFixture(league.id, tigres.id, "Suplente");
    const match = await createFinishedMatch(league.id, tigres.id, leones.id);
    await createGoal(match.id, tigres.id, scorer.id);

    const withGoals = await deletePlayer(league.id, scorer.id, headers);
    const withoutGoals = await deletePlayer(league.id, benched.id, headers);

    expect(withGoals).toMatchObject({ ok: false, error: { code: "PLAYER_HAS_GOALS" } });
    expect(withoutGoals).toEqual({ ok: true, data: null });
    expect(await db.player.findUnique({ where: { id: scorer.id } })).not.toBeNull();
    expect(await db.player.findUnique({ where: { id: benched.id } })).toBeNull();
  });

  it("no agrega jugadores a un equipo de otra liga", async () => {
    const { league, user, headers } = await ownLeagueWithTeams();
    const otherLeague = await createLeague({ ownerId: user.id });
    const foreign = await createTeam(otherLeague.id);

    const result = await createPlayer(league.id, foreign.id, { name: "Juan" }, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(await db.player.count({ where: { teamId: foreign.id } })).toBe(0);
  });

  it("en una liga finalizada no se agregan ni editan jugadores (RF-76)", async () => {
    const { league, tigres, headers } = await ownLeagueWithTeams();
    const player = await createPlayerFixture(league.id, tigres.id, "Juan");
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });

    const created = await createPlayer(league.id, tigres.id, { name: "Pedro" }, headers);
    const renamed = await updatePlayer(league.id, player.id, { name: "Juanito" }, headers);

    expect(created).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
    expect(renamed).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
  });
});
