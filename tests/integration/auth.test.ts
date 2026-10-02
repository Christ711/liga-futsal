import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const uniqueEmail = () => `ayudante-${crypto.randomUUID()}@example.com`;

describe("Better Auth (RF-5, RF-6)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("crea una cuenta con correo y contraseña, sin verificar el correo y con el nombre vacío", async () => {
    const email = uniqueEmail();

    const result = await auth.api.signUpEmail({
      body: { email, password: "contraseña-segura", name: "" },
    });

    expect(result.token).toEqual(expect.any(String));
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.name).toBe("");
    expect(user.emailVerified).toBe(false);
  });

  it("al registrarse inicia una sesión que vence a los 30 días, sin IP ni user agent", async () => {
    const email = uniqueEmail();
    const before = Date.now();

    await auth.api.signUpEmail({
      body: { email, password: "contraseña-segura", name: "" },
      headers: new Headers({
        "user-agent": "Mozilla/5.0 (iPhone)",
        "x-forwarded-for": "203.0.113.7",
      }),
    });

    const user = await db.user.findUniqueOrThrow({ where: { email }, include: { sessions: true } });
    expect(user.sessions).toHaveLength(1);
    const session = user.sessions[0]!;
    const lifetime = session.expiresAt.getTime() - before;
    expect(lifetime).toBeGreaterThan(THIRTY_DAYS_MS - 60_000);
    expect(lifetime).toBeLessThan(THIRTY_DAYS_MS + 60_000);
    expect(session.ipAddress).toBeNull();
    expect(session.userAgent).toBeNull();
  });

  it("guarda la contraseña como hash, nunca en texto plano", async () => {
    const email = uniqueEmail();

    await auth.api.signUpEmail({ body: { email, password: "contraseña-segura", name: "" } });

    const user = await db.user.findUniqueOrThrow({ where: { email }, include: { accounts: true } });
    const stored = user.accounts[0]!.password;
    expect(stored).toEqual(expect.any(String));
    expect(stored).not.toContain("contraseña-segura");
  });

  it("rechaza una contraseña de menos de 8 caracteres", async () => {
    await expect(
      auth.api.signUpEmail({ body: { email: uniqueEmail(), password: "1234567", name: "" } }),
    ).rejects.toThrow();
  });
});
