import { e2eDatabaseUrl } from "../../playwright.config";
import { resetTestDatabase } from "../support/reset-test-database";

/** Antes de la ejecución, deja `liga_e2e` vacía y migrada (ADR 019). */
export default async function globalSetup() {
  await resetTestDatabase(e2eDatabaseUrl);
}
