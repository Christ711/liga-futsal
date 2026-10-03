import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";
import { createLeague } from "@/server/use-cases/create-league";
import { deleteLeague } from "@/server/use-cases/delete-league";
import { updateLeague } from "@/server/use-cases/update-league";

import { createLeague as createLeagueFixture } from "../support/fixtures";
import { signedUpAccount } from "../support/session";

const uniqueName = () => `Liga ${crypto.randomUUID().slice(0, 8)}`;

describe("casos de uso de ligas (RF-13, RF-15, RF-18, RF-76)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("crea la liga en curso con el ayudante de la sesión como dueño", async () => {
    const { user, headers } = await signedUpAccount();

    const result = await createLeague({ name: uniqueName(), semester: "2026-2" }, headers);

    expect(result.ok).toBe(true);
    const league = await db.league.findUniqueOrThrow({
      where: { id: result.ok ? result.data.id : "" },
    });
    expect(league).toMatchObject({ ownerId: user.id, status: "IN_PROGRESS" });
  });

  it("sin sesión no crea nada", async () => {
    const name = uniqueName();

    const result = await createLeague({ name, semester: "2026-2" }, new Headers());

    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(await db.league.count({ where: { name } })).toBe(0);
  });

  it("dos creaciones simultáneas con el mismo nombre dejan una sola liga", async () => {
    const { headers } = await signedUpAccount();
    const name = uniqueName();

    const results = await Promise.all([
      createLeague({ name, semester: "2026-2" }, headers),
      createLeague({ name: name.toUpperCase(), semester: "2026-2" }, headers),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)).toMatchObject({
      error: { code: "DUPLICATE_NAME" },
    });
  });

  it("otro ayudante no puede editar ni eliminar la liga y nada cambia", async () => {
    const league = await createLeagueFixture();
    const { headers } = await signedUpAccount();

    const update = await updateLeague(
      league.id,
      { name: uniqueName(), semester: "2026-1" },
      headers,
    );
    const remove = await deleteLeague(league.id, headers);

    expect(update).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(remove).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await db.league.findUnique({ where: { id: league.id } })).toMatchObject({
      name: league.name,
      semester: league.semester,
    });
  });

  it("una liga finalizada no se edita, pero sí se elimina", async () => {
    const { user, headers } = await signedUpAccount();
    const league = await createLeagueFixture({ ownerId: user.id });
    await db.league.update({ where: { id: league.id }, data: { status: "FINALIZED" } });

    const update = await updateLeague(
      league.id,
      { name: uniqueName(), semester: league.semester },
      headers,
    );
    const remove = await deleteLeague(league.id, headers);

    expect(update).toMatchObject({ ok: false, error: { code: "LEAGUE_FINALIZED" } });
    expect(remove).toEqual({ ok: true, data: null });
    expect(await db.league.findUnique({ where: { id: league.id } })).toBeNull();
  });
});
