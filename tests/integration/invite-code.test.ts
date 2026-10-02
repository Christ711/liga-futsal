import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";

const uniqueEmail = () => `ayudante-${crypto.randomUUID()}@example.com`;
const password = "contraseña-segura";

/** El código de invitación de las pruebas, definido en vitest.config.ts. */
const INVITE_CODE = process.env.INVITE_CODE!;

const signUp = (email: string, inviteCode?: string) =>
  auth.api.signUpEmail({
    body: { email, password, name: "", ...(inviteCode === undefined ? {} : { inviteCode }) },
  });

describe("código de invitación en el registro (RF-2)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("acepta el registro con el código correcto", async () => {
    const email = uniqueEmail();

    await expect(signUp(email, INVITE_CODE)).resolves.toMatchObject({ user: { email } });
  });

  it("rechaza el registro sin código y no crea la cuenta", async () => {
    const email = uniqueEmail();

    await expect(signUp(email)).rejects.toMatchObject({
      body: { code: "INVALID_INVITE_CODE", message: "Código de invitación incorrecto" },
    });
    expect(await db.user.count({ where: { email } })).toBe(0);
  });

  it("rechaza el registro con un código incorrecto y no crea la cuenta", async () => {
    const email = uniqueEmail();

    await expect(signUp(email, "codigo-equivocado")).rejects.toMatchObject({
      body: { code: "INVALID_INVITE_CODE" },
    });
    expect(await db.user.count({ where: { email } })).toBe(0);
  });

  it("rechaza un código que solo difiere en mayúsculas o espacios", async () => {
    await expect(signUp(uniqueEmail(), ` ${INVITE_CODE.toUpperCase()} `)).rejects.toMatchObject({
      body: { code: "INVALID_INVITE_CODE" },
    });
  });

  it("no guarda el código de invitación en la cuenta", async () => {
    const email = uniqueEmail();
    await signUp(email, INVITE_CODE);

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(JSON.stringify(user)).not.toContain(INVITE_CODE);
  });
});
