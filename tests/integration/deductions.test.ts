import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import {
  createPointDeduction,
  deletePointDeduction,
  updatePointDeduction,
} from "@/server/use-cases/point-deductions";

import { createLeague, createTeam } from "../support/fixtures";
import { signedUpAccount } from "../support/session";

async function ownTeam() {
  const account = await signedUpAccount();
  const league = await createLeague({ ownerId: account.user.id });
  const team = await createTeam(league.id, "Tigres");
  return { ...account, league, team };
}

describe("casos de uso de descuentos (RF-13, RF-67 a RF-69)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("aplica varios descuentos al mismo equipo, edita uno y elimina otro (RF-68, RF-69)", async () => {
    const { league, team, headers } = await ownTeam();

    await createPointDeduction(
      league.id,
      { teamId: team.id, points: "3", reason: "Tarjetas" },
      headers,
    );
    await createPointDeduction(
      league.id,
      { teamId: team.id, points: "2", reason: "Atraso" },
      headers,
    );
    const [first, second] = await db.pointDeduction.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "asc" },
    });
    const updated = await updatePointDeduction(
      league.id,
      first!.id,
      { points: "5", reason: "Tarjetas rojas" },
      headers,
    );
    const deleted = await deletePointDeduction(league.id, second!.id, headers);

    expect(updated).toEqual({ ok: true, data: null });
    expect(deleted).toEqual({ ok: true, data: null });
    expect(
      await db.pointDeduction.findMany({
        where: { teamId: team.id },
        select: { points: true, reason: true },
      }),
    ).toEqual([{ points: 5, reason: "Tarjetas rojas" }]);
  });

  it("otro ayudante no puede aplicar, editar ni eliminar descuentos", async () => {
    const { league, team } = await ownTeam();
    const deduction = await db.pointDeduction.create({
      data: { teamId: team.id, points: 1, reason: "Atraso" },
    });
    const { headers } = await signedUpAccount();

    const results = [
      await createPointDeduction(league.id, { teamId: team.id, points: "3", reason: "x" }, headers),
      await updatePointDeduction(league.id, deduction.id, { points: "9", reason: "x" }, headers),
      await deletePointDeduction(league.id, deduction.id, headers),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    }
    expect(await db.pointDeduction.findMany({ where: { teamId: team.id } })).toMatchObject([
      { points: 1, reason: "Atraso" },
    ]);
  });

  it("un descuento de un equipo de otra liga se trata como inexistente", async () => {
    const { league, user, headers } = await ownTeam();
    const otherLeague = await createLeague({ ownerId: user.id });
    const foreignTeam = await createTeam(otherLeague.id);
    const foreign = await db.pointDeduction.create({
      data: { teamId: foreignTeam.id, points: 1, reason: "Atraso" },
    });

    const applied = await createPointDeduction(
      league.id,
      { teamId: foreignTeam.id, points: "3", reason: "x" },
      headers,
    );
    const removed = await deletePointDeduction(league.id, foreign.id, headers);

    expect(applied).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(removed).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("en una liga finalizada no se cambian descuentos (RF-76)", async () => {
    const { league, team, headers } = await ownTeam();
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });

    const result = await createPointDeduction(
      league.id,
      { teamId: team.id, points: "3", reason: "Tarjetas" },
      headers,
    );

    expect(result).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
  });
});
