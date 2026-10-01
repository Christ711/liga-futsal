import { execFileSync } from "node:child_process";

import pg from "pg";

/** Bases desechables que los tests pueden reiniciar (ADR 019). */
const RESETTABLE_DATABASES = new Set(["liga_integration", "liga_e2e"]);
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/**
 * Deja una base de pruebas vacía y con todas las migraciones aplicadas: la crea
 * si no existe, borra y recrea su esquema `public` y aplica `prisma migrate deploy`.
 *
 * Reemplaza a `prisma migrate reset`, que exige consentimiento manual cuando lo
 * ejecuta un agente de IA. Para compensar, solo actúa sobre `liga_integration` o
 * `liga_e2e`, y solo en un host local o en CI.
 */
export async function resetTestDatabase(databaseUrl: string): Promise<void> {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.slice(1);
  const isLocalHost = LOCAL_HOSTS.has(url.hostname);
  const isCi = process.env.CI === "true";

  if (!RESETTABLE_DATABASES.has(databaseName) || !(isLocalHost || isCi)) {
    throw new Error(
      `Reinicio rechazado: solo se reinician ${[...RESETTABLE_DATABASES].join(" o ")} en un host local o en CI (se recibió la base "${databaseName}" en "${url.hostname}").`,
    );
  }

  await createDatabaseIfMissing(url, databaseName);

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public");
  } finally {
    await client.end();
  }

  execFileSync("pnpm", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: databaseUrl, PRISMA_HIDE_UPDATE_MESSAGE: "1" },
    stdio: "inherit",
  });
}

async function createDatabaseIfMissing(url: URL, databaseName: string): Promise<void> {
  const maintenanceUrl = new URL(url);
  maintenanceUrl.pathname = "/postgres";
  const client = new pg.Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  try {
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      databaseName,
    ]);
    if (existing.rowCount === 0) {
      // El nombre ya pasó por la lista de bases permitidas; no viene del usuario.
      await client.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await client.end();
  }
}
