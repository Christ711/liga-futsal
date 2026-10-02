import { describe, expect, it } from "vitest";

import { sendEmail } from "@/server/email/send";
import { passwordResetEmail } from "@/server/email/templates/password-reset";

import { firstLink, waitForEmailTo } from "../e2e/helpers/mailpit";

describe("correo de recuperación (RF-10)", () => {
  it("la plantilla está en español y contiene el link y su vigencia", () => {
    const email = passwordResetEmail("https://liga.example/restablecer?token=abc123");

    expect(email.subject).toBe("Recupera tu contraseña de Liga Futsal");
    expect(email.text).toContain("https://liga.example/restablecer?token=abc123");
    expect(email.text).toContain("1 hora");
    expect(email.html).toContain('href="https://liga.example/restablecer?token=abc123"');
  });

  it("la plantilla escapa el link en el HTML", () => {
    const email = passwordResetEmail('https://liga.example/?a=1&b="2"');

    expect(email.html).toContain("https://liga.example/?a=1&amp;b=&quot;2&quot;");
  });

  it("envía el correo por SMTP y Mailpit lo recibe con su link", async () => {
    const to = `ayudante-${crypto.randomUUID()}@example.com`;
    const link = `https://liga.example/restablecer?token=${crypto.randomUUID()}`;

    await sendEmail({ to, ...passwordResetEmail(link) });

    const received = await waitForEmailTo(to);
    expect(received.to).toBe(to);
    expect(received.from).toBe("liga-futsal@example.com");
    expect(received.subject).toBe("Recupera tu contraseña de Liga Futsal");
    expect(firstLink(received)).toBe(link);
  });
});
