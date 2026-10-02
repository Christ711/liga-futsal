import { expect, test } from "@playwright/test";

import { createAccount, formAlert, queryDatabase } from "./helpers/accounts";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

const sessionCookie = async (page: import("@playwright/test").Page) =>
  (await page.context().cookies()).find((cookie) => cookie.name.endsWith("session_token"));

test("inicia sesión con correo y contraseña correctos y la sesión dura 30 días (RF-6)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);

  await signIn(page, account.email, account.password);

  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  const cookie = await sessionCookie(page);
  expect(cookie).toBeDefined();
  const lifetime = cookie!.expires - Date.now() / 1000;
  expect(lifetime).toBeGreaterThan(THIRTY_DAYS_SECONDS - 120);
  expect(lifetime).toBeLessThan(THIRTY_DAYS_SECONDS + 120);
  expect(cookie!.httpOnly).toBe(true);
});

test("rechaza una contraseña incorrecta sin decir cuál dato falló", async ({ page, request }) => {
  const account = await createAccount(request);

  await signIn(page, account.email, "otra-contraseña");

  await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
  expect(await sessionCookie(page)).toBeUndefined();
});

test("rechaza un correo sin cuenta con el mismo mensaje", async ({ page }) => {
  await signIn(page, "nadie@example.com", "cualquier-contraseña");

  await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
});

test("al cerrar sesión la cookie desaparece y la sesión se borra de la base (RF-8)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);
  await signIn(page, account.email, account.password);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  const before = await sessionCookie(page);
  const token = decodeURIComponent(before!.value).split(".")[0];
  expect(await queryDatabase("SELECT 1 FROM session WHERE token = $1", [token])).toHaveLength(1);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  expect(await sessionCookie(page)).toBeUndefined();
  expect(await queryDatabase("SELECT 1 FROM session WHERE token = $1", [token])).toHaveLength(0);
});

test("sin sesión, el encabezado ofrece ingresar y no cerrar sesión (RF-12)", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(0);
});

test("la página de ingreso cabe en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
}) => {
  await page.goto("/ingresar");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
