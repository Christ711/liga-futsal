import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { updateTeam } from "@/server/use-cases/update-team";

import { createLeague, createTeam } from "../support/fixtures";
import { signedUpAccount } from "../support/session";

/** Otra sesión de la misma cuenta, como un segundo dispositivo. */
async function secondDevice(email: string) {
  const response = await auth.api.signInEmail({
    body: { email, password: "contraseña-segura" },
    asResponse: true,
  });
  return new Headers({ cookie: response.headers.get("set-cookie")!.split(";")[0]! });
}

describe("el último cambio gana entre dos dispositivos (RF-85)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("dos renombres consecutivos del mismo equipo desde dos sesiones dejan el nombre del último", async () => {
    const { user, headers: phone } = await signedUpAccount();
    const laptop = await secondDevice(user.email);
    const league = await createLeague({ ownerId: user.id });
    const team = await createTeam(league.id, "Tigres");

    const first = await updateTeam(league.id, team.id, { name: "Tigres del Norte" }, phone);
    const second = await updateTeam(league.id, team.id, { name: "Tigres del Sur" }, laptop);

    // Ninguno se rechaza por conflicto: no hay bloqueo optimista.
    expect(first).toEqual({ ok: true, data: null });
    expect(second).toEqual({ ok: true, data: null });
    expect((await db.team.findUniqueOrThrow({ where: { id: team.id } })).name).toBe(
      "Tigres del Sur",
    );
    expect(await db.session.count({ where: { userId: user.id } })).toBe(2);
  });
});
