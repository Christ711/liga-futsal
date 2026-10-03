import { readFileSync } from "node:fs";

import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { createTeam } from "@/server/use-cases/create-team";
import { deleteTeam } from "@/server/use-cases/delete-team";
import { removeTeamCrest } from "@/server/use-cases/remove-team-crest";
import { setTeamCrest } from "@/server/use-cases/set-team-crest";
import { updateTeam } from "@/server/use-cases/update-team";

import { createLeague, createTeam as createTeamFixture } from "../support/fixtures";
import { signedUpAccount } from "../support/session";

const png = () => readFileSync("tests/fixtures/crests/escudo-600x300.png");

/** Liga de un ayudante con sesión. */
async function ownLeague() {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  return { ...account, league };
}

describe("casos de uso de equipos (RF-13, RF-23 a RF-26, RF-32)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("otro ayudante no puede crear, editar, eliminar ni cambiar escudos, y nada cambia", async () => {
    const { league } = await ownLeague();
    const team = await createTeamFixture(league.id, "Los Tigres");
    const { headers } = await signedUpAccount();

    const results = [
      await createTeam(league.id, { name: "Halcones" }, headers),
      await updateTeam(league.id, team.id, { name: "Otro" }, headers),
      await deleteTeam(league.id, team.id, headers),
      await setTeamCrest(league.id, team.id, png(), headers),
      await removeTeamCrest(league.id, team.id, headers),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    }
    expect(
      await db.team.findMany({ where: { leagueId: league.id }, select: { name: true } }),
    ).toEqual([{ name: "Los Tigres" }]);
    expect(await db.teamCrest.count({ where: { teamId: team.id } })).toBe(0);
  });

  it("con una fecha creada rechaza agregar y eliminar equipos, pero permite editarlos (RF-24, RF-25)", async () => {
    const { league, headers } = await ownLeague();
    const team = await createTeamFixture(league.id, "Los Tigres");
    await db.matchday.create({ data: { leagueId: league.id, playDate: new Date("2026-09-01") } });

    const created = await createTeam(league.id, { name: "Halcones" }, headers);
    const deleted = await deleteTeam(league.id, team.id, headers);
    const renamed = await updateTeam(league.id, team.id, { name: "Tigres" }, headers);
    const crest = await setTeamCrest(league.id, team.id, png(), headers);

    expect(created).toMatchObject({ ok: false, error: { code: "TEAMS_LOCKED" } });
    expect(deleted).toMatchObject({ ok: false, error: { code: "TEAMS_LOCKED" } });
    expect(renamed).toEqual({ ok: true, data: null });
    expect(crest).toEqual({ ok: true, data: null });
  });

  it("en una liga finalizada no se cambia nada de los equipos (RF-76)", async () => {
    const { league, headers } = await ownLeague();
    const team = await createTeamFixture(league.id, "Los Tigres");
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });

    const renamed = await updateTeam(league.id, team.id, { name: "Tigres" }, headers);
    const crest = await setTeamCrest(league.id, team.id, png(), headers);

    expect(renamed).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
    expect(crest).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
  });

  it("un equipo de otra liga del mismo dueño se trata como inexistente", async () => {
    const { league, user, headers } = await ownLeague();
    const otherLeague = await createLeague({ ownerId: user.id });
    const foreign = await createTeamFixture(otherLeague.id, "Los Tigres");

    const result = await updateTeam(league.id, foreign.id, { name: "Tigres" }, headers);

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("dos equipos simultáneos con el mismo nombre dejan uno solo (RF-26)", async () => {
    const { league, headers } = await ownLeague();

    const results = await Promise.all([
      createTeam(league.id, { name: "Los Tigres" }, headers),
      createTeam(league.id, { name: "los tigres" }, headers),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(await db.team.count({ where: { leagueId: league.id } })).toBe(1);
  });

  it("guarda el escudo procesado y al reemplazarlo cambia su hash (RF-30, RF-32)", async () => {
    const { league, headers } = await ownLeague();
    const team = await createTeamFixture(league.id, "Los Tigres");

    await setTeamCrest(league.id, team.id, png(), headers);
    const first = await db.teamCrest.findUniqueOrThrow({ where: { teamId: team.id } });
    await setTeamCrest(
      league.id,
      team.id,
      readFileSync("tests/fixtures/crests/escudo-300x300.jpg"),
      headers,
    );
    const second = await db.teamCrest.findUniqueOrThrow({ where: { teamId: team.id } });

    expect(second.hash).not.toBe(first.hash);
    expect(Buffer.from(second.data).subarray(8, 12).toString()).toBe("WEBP");
  });
});
