import { expect, test } from "@playwright/test";

import { e2eInviteCode } from "../../playwright.config";
import {
  PASSWORD,
  apiPost,
  createAccount,
  formAlert,
  queryDatabase,
  uniqueEmail,
} from "./helpers/accounts";

async function fillRegistration(
  page: import("@playwright/test").Page,
  values: { email: string; password: string; inviteCode: string },
) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(values.email);
  await page.getByLabel("Contraseña").fill(values.password);
  await page.getByLabel("Código de invitación").fill(values.inviteCode);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

test("registra una cuenta con el código correcto e inicia su sesión (RF-1, RF-5)", async ({
  page,
}) => {
  const email = uniqueEmail();

  await fillRegistration(page, { email, password: PASSWORD, inviteCode: e2eInviteCode });

  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  const session = await page.request.get("/api/auth/get-session");
  expect((await session.json()).user).toMatchObject({ email, emailVerified: false });
  const [account] = await queryDatabase<{ name: string }>(
    'SELECT name FROM "user" WHERE email = $1',
    [email],
  );
  expect(account?.name).toBe("");
});

test("rechaza un código de invitación incorrecto con su mensaje (RF-2)", async ({ page }) => {
  const email = uniqueEmail();

  await fillRegistration(page, { email, password: PASSWORD, inviteCode: "codigo-equivocado" });

  await expect(formAlert(page)).toHaveText("Código de invitación incorrecto");
  await expect(page).toHaveURL(/\/registro$/);
  expect(await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [email])).toHaveLength(0);
});

test("ante un correo ya registrado, rechaza y ofrece recuperar la contraseña (RF-3)", async ({
  page,
  request,
}) => {
  const existing = await createAccount(request);

  await fillRegistration(page, {
    email: existing.email,
    password: PASSWORD,
    inviteCode: e2eInviteCode,
  });

  await expect(formAlert(page)).toContainText("Ya existe una cuenta con ese correo");
  await expect(formAlert(page).getByRole("link", { name: "Recuperar contraseña" })).toHaveAttribute(
    "href",
    "/recuperar",
  );
});

test("rechaza una contraseña de 7 caracteres indicando el mínimo (RF-4)", async ({ page }) => {
  const email = uniqueEmail();

  await fillRegistration(page, { email, password: "1234567", inviteCode: e2eInviteCode });

  await expect(page.getByText("Usa al menos 8 caracteres.")).toBeVisible();
  expect(await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [email])).toHaveLength(0);
});

test("una llamada directa a la API de registro sin código se rechaza (RF-2)", async ({
  request,
}) => {
  const email = uniqueEmail();

  const response = await apiPost(request, "/api/auth/sign-up/email", {
    data: { email, password: PASSWORD, name: "" },
  });

  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ code: "INVALID_INVITE_CODE" });
  expect(await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [email])).toHaveLength(0);
});

test("la página de registro cabe en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
}) => {
  await page.goto("/registro");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
