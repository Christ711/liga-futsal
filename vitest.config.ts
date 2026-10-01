import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Base de los tests de integración, separada de la de desarrollo y la de E2E
// (ADR 019). CI la reemplaza con INTEGRATION_DATABASE_URL.
const integrationDatabaseUrl =
  process.env.INTEGRATION_DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5433/liga_integration";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // `server-only` lanza fuera del entorno de servidor de React; en los tests
  // se usa su versión vacía, la misma que recibe el servidor de Next.js.
  "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/setup.ts"],
          env: { DATABASE_URL: integrationDatabaseUrl },
          // Comparten una base: los archivos corren de a uno para no pisarse.
          fileParallelism: false,
        },
      },
    ],
  },
});
