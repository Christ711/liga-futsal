import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Base propia de los E2E, separada de la de desarrollo y la de integración
// (ADR 019). CI la reemplaza con E2E_DATABASE_URL.
export const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5433/liga_e2e";

/** Código de invitación de las pruebas E2E; los tests lo importan desde aquí. */
export const e2eInviteCode = "codigo-de-pruebas-e2e";

export default defineConfig({
  testDir: "tests/e2e",
  // Reinicia liga_e2e antes de la ejecución.
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "es-CL",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
  },
  projects: [
    {
      // La app se usa sobre todo en el celular: todo se prueba a 360 px (RNF-3).
      name: "mobile-360",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 740 },
      },
    },
  ],
  webServer: {
    // Siempre contra el build de producción (ADR 013), nunca contra `next dev`.
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      // Secreto fijo solo para pruebas; nunca se usa fuera de bases desechables.
      BETTER_AUTH_SECRET: "secreto-de-pruebas-e2e-no-usar-en-produccion",
      BETTER_AUTH_URL: `http://127.0.0.1:${PORT}`,
      INVITE_CODE: e2eInviteCode,
      // Mailpit de docker-compose o del job de CI (ADR 018).
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
      MAIL_FROM: "Liga Futsal <liga-futsal@example.com>",
    },
  },
});
