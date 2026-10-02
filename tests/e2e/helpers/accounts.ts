import type { APIRequestContext, Page } from "@playwright/test";
import pg from "pg";

import { e2eDatabaseUrl, e2eInviteCode } from "../../../playwright.config";

export const PASSWORD = "contraseña-segura";

export const uniqueEmail = () => `ayudante-${crypto.randomUUID()}@example.com`;

/** URL base de la app bajo prueba, la misma de `playwright.config.ts`. */
const ORIGIN = "http://127.0.0.1:3100";

/** La alerta de rechazo del formulario; Next.js agrega otra `role="alert"` para anunciar rutas. */
export const formAlert = (page: Page) => page.locator("form").getByRole("alert");

/**
 * POST a la API con la cabecera `Origin`, como la envía un navegador. Better
 * Auth la exige cuando la petición lleva cookies (protección CSRF).
 */
export const apiPost = (request: APIRequestContext, path: string, options: { data: unknown }) =>
  request.post(path, { ...options, headers: { origin: ORIGIN } });

/**
 * Crea una cuenta por la API de autenticación, sin pasar por la interfaz
 * (ADR 019). Usa un contexto de petición aparte, así que no deja sesión
 * iniciada en la página del test.
 */
export async function createAccount(request: APIRequestContext) {
  const email = uniqueEmail();
  const response = await apiPost(request, "/api/auth/sign-up/email", {
    data: { email, password: PASSWORD, name: "", inviteCode: e2eInviteCode },
  });
  if (!response.ok()) {
    throw new Error(
      `No se pudo crear la cuenta de prueba: ${response.status()} ${await response.text()}`,
    );
  }
  return { email, password: PASSWORD };
}

/** Consulta directa a la base de E2E, para comprobar lo que quedó guardado. */
export async function queryDatabase<T extends pg.QueryResultRow>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const client = new pg.Client({ connectionString: e2eDatabaseUrl });
  await client.connect();
  try {
    return (await client.query<T>(sql, values)).rows;
  } finally {
    await client.end();
  }
}
