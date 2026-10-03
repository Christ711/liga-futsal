import { expect, test, type Page } from "@playwright/test";

import { createAccount, formAlert, queryDatabase, signIn, uniqueEmail } from "./helpers/accounts";
import { countEmailsTo, firstLink, waitForEmailTo } from "./helpers/mailpit";

const NEUTRAL_MESSAGE = "Si el correo existe, te enviamos un link";
const INVALID_LINK = "El link ya no es válido. Solicita uno nuevo.";

async function requestReset(page: Page, email: string) {
  await page.goto("/recuperar");
  await page.getByLabel("Correo").fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toContainText(NEUTRAL_MESSAGE);
}

test("con un correo registrado muestra el mensaje neutro y envía el link (RF-9, RF-10)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);

  await requestReset(page, account.email);

  const email = await waitForEmailTo(account.email);
  expect(email.subject).toBe("Recupera tu contraseña de Liga Futsal");
  expect(firstLink(email)).toContain("/api/auth/reset-password/");
});

test("con un correo sin cuenta muestra el mismo mensaje y no envía nada (RF-9)", async ({
  page,
}) => {
  const email = uniqueEmail();

  await requestReset(page, email);

  // Se da tiempo al envío en segundo plano antes de afirmar que no llegó nada.
  await page.waitForTimeout(1500);
  expect(await countEmailsTo(email)).toBe(0);
});

test("el link permite definir una contraseña nueva y cierra todas las sesiones (RF-11, RF-86)", async ({
  page,
  request,
  browser,
}) => {
  const account = await createAccount(request);
  // Otro dispositivo con la sesión iniciada.
  const otherDevice = await browser.newContext();
  const otherPage = await otherDevice.newPage();
  await signIn(otherPage, account.email, account.password);
  await expect(otherPage.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();

  await requestReset(page, account.email);
  const link = firstLink(await waitForEmailTo(account.email));
  await page.goto(link);
  await expect(page).toHaveURL(/\/restablecer\?token=/);
  await page.getByLabel("Contraseña nueva").fill("otra-contraseña-segura");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();

  await expect(page).toHaveURL(/\/ingresar/);
  await expect(page.getByRole("status")).toContainText("Contraseña actualizada");
  const sessions = await queryDatabase(
    'SELECT 1 FROM session s JOIN "user" u ON u.id = s."userId" WHERE u.email = $1',
    [account.email],
  );
  expect(sessions).toHaveLength(0);
  await otherPage.reload();
  await expect(otherPage.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await otherDevice.close();

  // La contraseña anterior ya no sirve y la nueva sí.
  await signIn(page, account.email, account.password);
  await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
  await signIn(page, account.email, "otra-contraseña-segura");
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});

test("un link ya usado se rechaza e invita a solicitar uno nuevo (RF-11)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);
  await requestReset(page, account.email);
  const link = firstLink(await waitForEmailTo(account.email));
  await page.goto(link);
  await page.getByLabel("Contraseña nueva").fill("otra-contraseña-segura");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page).toHaveURL(/\/ingresar/);

  await page.goto(link);

  await expect(page.getByRole("alert").filter({ hasText: INVALID_LINK })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitar un link nuevo" })).toHaveAttribute(
    "href",
    "/recuperar",
  );
});

test("un link vencido se rechaza e invita a solicitar uno nuevo (RF-11)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);
  await requestReset(page, account.email);
  const link = firstLink(await waitForEmailTo(account.email));
  // Se vence el link directamente en la base: el servidor de E2E no permite adelantar el reloj.
  await queryDatabase(
    `UPDATE verification SET "expiresAt" = now() - interval '1 minute'
     WHERE value = (SELECT id FROM "user" WHERE email = $1)`,
    [account.email],
  );

  await page.goto(link);

  await expect(page.getByRole("alert").filter({ hasText: INVALID_LINK })).toBeVisible();
});

test("el link vence 1 hora después de pedirlo (RF-11)", async ({ page, request }) => {
  const account = await createAccount(request);
  const before = Date.now();

  await requestReset(page, account.email);
  await waitForEmailTo(account.email);

  const [row] = await queryDatabase<{ expiresAt: Date }>(
    `SELECT "expiresAt" FROM verification WHERE value = (SELECT id FROM "user" WHERE email = $1)`,
    [account.email],
  );
  const lifetimeMinutes = (new Date(row!.expiresAt).getTime() - before) / 60_000;
  expect(lifetimeMinutes).toBeGreaterThan(59);
  expect(lifetimeMinutes).toBeLessThan(61);
});

test("rechaza una contraseña nueva de 7 caracteres indicando el mínimo (RF-4)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);
  await requestReset(page, account.email);
  await page.goto(firstLink(await waitForEmailTo(account.email)));

  await page.getByLabel("Contraseña nueva").fill("1234567");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();

  await expect(page.getByText("Usa al menos 8 caracteres.")).toBeVisible();
});

test("abrir la página de restablecer sin link válido invita a solicitar uno nuevo", async ({
  page,
}) => {
  await page.goto("/restablecer");

  await expect(page.getByRole("alert").filter({ hasText: INVALID_LINK })).toBeVisible();
});

test("las páginas de recuperación caben en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
}) => {
  for (const path of ["/recuperar", "/restablecer"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
  }
});
