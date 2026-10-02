import { afterAll, describe, expect, it } from "vitest";

import { nameKey } from "@/domain/names";
import { db } from "@/server/db/client";

import { createLeague, createPlayer, createTeam, createUser } from "../support/fixtures";

/** Código de Prisma para una violación de índice único. */
const UNIQUE_VIOLATION = { code: "P2002" };

describe("esquema de ligas, equipos, escudos y jugadores", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("una liga nace en curso y con su dueño (RF-15)", async () => {
    const league = await createLeague();

    expect(league.status).toBe("IN_PROGRESS");
    expect(league.finalizedAt).toBeNull();
  });

  it("un ayudante puede ser dueño de varias ligas, de uno o varios semestres (RF-21)", async () => {
    const owner = await createUser();

    await createLeague({ ownerId: owner.id, semester: "2026-1" });
    await createLeague({ ownerId: owner.id, semester: "2026-2" });
    await createLeague({ ownerId: owner.id, semester: "2026-2" });

    expect(await db.league.count({ where: { ownerId: owner.id } })).toBe(3);
  });

  it("rechaza dos ligas con la misma nameKey en el mismo semestre, aunque sean de otro dueño (RF-18)", async () => {
    const name = `Liga de Futsal ${crypto.randomUUID()}`;
    await createLeague({ name, semester: "2026-2" });

    await expect(
      createLeague({ name: `  ${name.toUpperCase()}  `, semester: "2026-2" }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);
  });

  it("permite el mismo nombre de liga en semestres distintos (RF-18)", async () => {
    const name = `Liga de Futsal ${crypto.randomUUID()}`;
    await createLeague({ name, semester: "2026-1" });

    await expect(createLeague({ name, semester: "2026-2" })).resolves.toBeDefined();
  });

  it("rechaza dos equipos con la misma nameKey en la misma liga (RF-26)", async () => {
    const league = await createLeague();
    await createTeam(league.id, "Tigres");

    await expect(createTeam(league.id, " tigres ")).rejects.toMatchObject(UNIQUE_VIOLATION);
  });

  it("permite el mismo nombre de equipo en ligas distintas (RF-26)", async () => {
    const first = await createLeague();
    const second = await createLeague();
    await createTeam(first.id, "Tigres");

    await expect(createTeam(second.id, "Tigres")).resolves.toBeDefined();
  });

  it("rechaza dos jugadores con la misma nameKey en la misma liga, aunque sean de equipos distintos (RF-35)", async () => {
    const league = await createLeague();
    const tigres = await createTeam(league.id);
    const leones = await createTeam(league.id);
    await createPlayer(league.id, tigres.id, "Juan Pérez");

    await expect(createPlayer(league.id, leones.id, "JUAN PÉREZ")).rejects.toMatchObject(
      UNIQUE_VIOLATION,
    );
  });

  it("guarda el escudo aparte del equipo y lo borra con él", async () => {
    const league = await createLeague();
    const team = await createTeam(league.id);
    await db.teamCrest.create({
      data: { teamId: team.id, data: new Uint8Array([1, 2, 3]), hash: "abc123" },
    });

    const loaded = await db.team.findUniqueOrThrow({ where: { id: team.id } });
    expect(Object.keys(loaded)).not.toContain("data");

    await db.team.delete({ where: { id: team.id } });
    expect(await db.teamCrest.findUnique({ where: { teamId: team.id } })).toBeNull();
  });

  it("borrar una cuenta borra sus ligas, equipos, jugadores y escudos (RF-92)", async () => {
    const owner = await createUser();
    const league = await createLeague({ ownerId: owner.id });
    const team = await createTeam(league.id);
    await createPlayer(league.id, team.id);
    await db.teamCrest.create({
      data: { teamId: team.id, data: new Uint8Array([1]), hash: "x" },
    });

    await db.user.delete({ where: { id: owner.id } });

    expect(await db.league.count({ where: { id: league.id } })).toBe(0);
    expect(await db.team.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.player.count({ where: { leagueId: league.id } })).toBe(0);
    expect(await db.teamCrest.count({ where: { teamId: team.id } })).toBe(0);
  });

  it("usa la misma nameKey que el dominio", () => {
    expect(nameKey(" Tigres ")).toBe("tigres");
  });
});
