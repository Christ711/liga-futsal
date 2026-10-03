import { afterAll, describe, expect, it } from "vitest";

import { requireOwnedLeague } from "@/server/authz";
import { db } from "@/server/db/client";

import { createLeague, createUser } from "../support/fixtures";

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
});
