import { afterAll, describe, expect, it } from "vitest";

import { requireOwnedLeague, requireOwnedTeam } from "@/server/authz";
import { db } from "@/server/db/client";
import { createTeam as createTeamUseCase } from "@/server/use-cases/create-team";
import { generateMatchday } from "@/server/use-cases/generate-matchday";

import { createLeague, createTeam, createUser } from "../support/fixtures";
import { adminAccount } from "../support/session";

describe("requireOwnedLeague (RF-13, RF-76)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("devuelve la liga a su dueño", async () => {
    const league = await createLeague();

    const result = await requireOwnedLeague(league.ownerId, league.id);

    expect(result).toEqual({ ok: true, data: expect.objectContaining({ id: league.id }) });
  });

  it("rechaza con FORBIDDEN a un ayudante que no es el dueño", async () => {
    const league = await createLeague();
    const other = await createUser();

    const result = await requireOwnedLeague(other.id, league.id);

    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("rechaza con NOT_FOUND una liga que no existe", async () => {
    const user = await createUser();

    const result = await requireOwnedLeague(user.id, "liga-inexistente");

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("con una liga finalizada, rechaza con LEAGUE_FINALIZED solo si se exige que esté en curso", async () => {
    const league = await createLeague();
    await db.league.update({
      where: { id: league.id },
      data: { status: "FINALIZED", finalizedAt: new Date() },
    });

    const inProgress = await requireOwnedLeague(league.ownerId, league.id, {
      mustBeInProgress: true,
    });
    const any = await requireOwnedLeague(league.ownerId, league.id);

    expect(inProgress).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
    expect(any).toMatchObject({ ok: true });
  });

  it("al dueño de otra liga finalizada le responde FORBIDDEN, no LEAGUE_FINALIZED", async () => {
    const league = await createLeague();
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });
    const other = await createUser();

    const result = await requireOwnedLeague(other.id, league.id, { mustBeInProgress: true });

    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("devuelve una liga ajena a una cuenta administradora (RF-109, RF-112)", async () => {
    const league = await createLeague();
    const team = await createTeam(league.id);
    const admin = await adminAccount();

    const asOwner = await requireOwnedLeague(admin.user.id, league.id, { mustBeInProgress: true });
    const ownedTeam = await requireOwnedTeam(admin.user.id, league.id, team.id);

    expect(asOwner).toMatchObject({ ok: true, data: { id: league.id } });
    expect(ownedTeam.ok).toBe(true);
  });

  it("al administrador también se le aplica la regla de liga finalizada (RF-76)", async () => {
    const league = await createLeague();
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });
    const admin = await adminAccount();

    const result = await requireOwnedLeague(admin.user.id, league.id, { mustBeInProgress: true });

    expect(result).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
  });

  it("el administrador agrega equipos y genera fechas en la liga de otro ayudante (RF-109)", async () => {
    const league = await createLeague();
    const admin = await adminAccount();

    for (const name of ["Tigres", "Leones", "Pumas"]) {
      expect(await createTeamUseCase(league.id, { name }, admin.headers)).toEqual({
        ok: true,
        data: null,
      });
    }
    const matchday = await generateMatchday(league.id, { playDate: "2026-08-15" }, admin.headers);

    expect(matchday.ok).toBe(true);
    expect((await db.league.findUniqueOrThrow({ where: { id: league.id } })).ownerId).toBe(
      league.ownerId,
    );
  });
});
