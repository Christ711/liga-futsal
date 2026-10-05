import type { APIRequestContext, Page } from "@playwright/test";
import pg from "pg";

import { e2eAdminEmail, e2eDatabaseUrl, e2eInviteCode } from "../../../playwright.config";

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

/**
 * Inicia sesión con la cuenta administradora de `ADMIN_EMAILS` (RF-112). La
 * intenta crear siempre: puede existir de una repetición anterior, o la puede
 * estar creando a la vez otro test en paralelo (el índice único hace que solo
 * uno gane). En ambos casos basta con ingresar después.
 */
export async function signInAsAdmin(page: Page, request: APIRequestContext) {
  await apiPost(request, "/api/auth/sign-up/email", {
    data: { email: e2eAdminEmail, password: PASSWORD, name: "", inviteCode: e2eInviteCode },
  });
  await signIn(page, e2eAdminEmail, PASSWORD);
  await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();
}

/** Inicia sesión por la interfaz, como lo hace un ayudante. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/**
 * Cierra la sesión desde la cabecera y espera a que termine: navegar antes
 * dejaría que la respuesta del cierre borre la cookie de un ingreso posterior.
 */
export async function signOut(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: "Cerrar sesión" }).click();
  await page.getByRole("banner").getByRole("link", { name: "Ingresar" }).waitFor();
}

/** Crea una cuenta nueva e inicia sesión con ella en la página. */
export async function signInNewAccount(page: Page, request: APIRequestContext) {
  const account = await createAccount(request);
  await signIn(page, account.email, account.password);
  await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();
  return account;
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
