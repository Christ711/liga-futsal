import type { TestProject } from "vitest/node";

import { resetTestDatabase } from "../support/reset-test-database";

/** Antes de la ejecución, deja `liga_integration` vacía y migrada (ADR 019). */
export default async function setup(project: TestProject) {
  const databaseUrl = project.config.env.DATABASE_URL;
  if (typeof databaseUrl !== "string") {
    throw new Error("El proyecto de integración no definió DATABASE_URL.");
  }
  await resetTestDatabase(databaseUrl);
}
