import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";

import {
  createAccount,
  formAlert,
  queryDatabase,
  signIn,
  signInNewAccount,
  signOut,
  uniqueEmail,
} from "./helpers/accounts";
import { seedLeague, seedTeamWithCrest } from "./helpers/leagues";
import { countEmailsTo } from "./helpers/mailpit";

const NEW_PASSWORD = "otra-contraseña-segura";

/** Crea una cuenta, inicia sesión y abre `/cuenta`. */
async function openAccount(page: Page, request: APIRequestContext) {
  const account = await signInNewAccount(page, request);
  await page.goto("/cuenta");
  return account;
}

/** Otro dispositivo con la sesión de la misma cuenta iniciada. */
async function signInOnOtherDevice(browser: Browser, email: string, password: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email, password);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  return { context, page };
}

const section = (page: Page, name: string) => page.getByRole("region", { name });

const passwordHash = async (email: string) =>
  (
    await queryDatabase<{ password: string }>(
      'SELECT a.password FROM account a JOIN "user" u ON u.id = a."userId" WHERE u.email = $1',
      [email],
    )
  )[0]!.password;

async function changePassword(page: Page, current: string, next: string) {
  const form = section(page, "Cambiar contraseña");
  await form.getByLabel("Contraseña actual").fill(current);
  await form.getByLabel("Contraseña nueva").fill(next);
  await form.getByRole("button", { name: "Cambiar contraseña" }).click();
}

async function changeEmail(page: Page, email: string, password: string) {
  const form = section(page, "Cambiar correo");
  await form.getByLabel("Correo nuevo").fill(email);
  await form.getByLabel("Contraseña actual").fill(password);
  await form.getByRole("button", { name: "Cambiar correo" }).click();
}

async function createLeagueWithCrest(email: string, status: "IN_PROGRESS" | "FINALIZED") {
  const league = await seedLeague(email, { status });
  const team = await seedTeamWithCrest(league.id);
  return { leagueId: league.id, teamId: team.id };
}

test("sin sesión, la página de cuenta redirige a ingresar", async ({ page }) => {
  await page.goto("/cuenta");

  await expect(page).toHaveURL(/\/ingresar$/);
});

test("muestra el correo de la cuenta solo a su titular (RF-14)", async ({ page, request }) => {
  const account = await openAccount(page, request);

  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await expect(page.getByText(account.email)).toBeVisible();
});

test.describe("cambio de contraseña", () => {
  test("con la actual correcta la cambia y cierra la sesión de los demás dispositivos (RF-89)", async ({
    page,
    request,
    browser,
  }) => {
    const account = await openAccount(page, request);
    const other = await signInOnOtherDevice(browser, account.email, account.password);

    await changePassword(page, account.password, NEW_PASSWORD);

    await expect(section(page, "Cambiar contraseña").getByRole("status")).toHaveText(
      "Contraseña actualizada. Cerramos tu sesión en los demás dispositivos.",
    );
    // Este dispositivo sigue con la sesión iniciada; el otro ya no.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
    await other.page.reload();
    await expect(other.page.getByRole("link", { name: "Ingresar" })).toBeVisible();
    // La contraseña anterior ya no sirve y la nueva sí.
    await signIn(other.page, account.email, account.password);
    await expect(formAlert(other.page)).toHaveText("Correo o contraseña incorrectos.");
    await signIn(other.page, account.email, NEW_PASSWORD);
    await expect(other.page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
    await other.context.close();
  });

  test("con la actual incorrecta se rechaza sin cambiar nada (RF-90)", async ({
    page,
    request,
  }) => {
    const account = await openAccount(page, request);
    const before = await passwordHash(account.email);

    await changePassword(page, "no-es-la-actual", NEW_PASSWORD);

    await expect(
      section(page, "Cambiar contraseña").getByText("La contraseña actual es incorrecta."),
    ).toBeVisible();
    expect(await passwordHash(account.email)).toBe(before);
  });

  test("rechaza una contraseña nueva de 7 caracteres indicando el mínimo (RF-4)", async ({
    page,
    request,
  }) => {
    const account = await openAccount(page, request);
    const before = await passwordHash(account.email);

    await changePassword(page, account.password, "1234567");

    await expect(
      section(page, "Cambiar contraseña").getByText("Usa al menos 8 caracteres."),
    ).toBeVisible();
    expect(await passwordHash(account.email)).toBe(before);
  });
});

test.describe("cambio de correo", () => {
  test("con la contraseña correcta cambia el correo sin enviar mensajes (RF-87)", async ({
    page,
    request,
  }) => {
    const account = await openAccount(page, request);
    const newEmail = uniqueEmail();

    await changeEmail(page, newEmail, account.password);

    await expect(section(page, "Cambiar correo").getByRole("status")).toHaveText(
      "Correo actualizado.",
    );
    await expect(page.getByText(newEmail)).toBeVisible();
    expect(await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [newEmail])).toHaveLength(
      1,
    );
    // Se da tiempo a un envío que no debe ocurrir antes de afirmar que no llegó nada.
    await page.waitForTimeout(1500);
    expect(await countEmailsTo(newEmail)).toBe(0);
    expect(await countEmailsTo(account.email)).toBe(0);

    // Desde ahora se ingresa con el correo nuevo.
    await signOut(page);
    await signIn(page, account.email, account.password);
    await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
    await signIn(page, newEmail, account.password);
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  });

  test("guarda el correo nuevo en minúsculas y sin espacios", async ({ page, request }) => {
    const account = await openAccount(page, request);
    const newEmail = uniqueEmail();

    await changeEmail(page, `  ${newEmail.toUpperCase()} `, account.password);

    await expect(section(page, "Cambiar correo").getByRole("status")).toBeVisible();
    expect(await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [newEmail])).toHaveLength(
      1,
    );
  });

  test("con la contraseña incorrecta se rechaza sin cambiar el correo (RF-90)", async ({
    page,
    request,
  }) => {
    const account = await openAccount(page, request);
    const newEmail = uniqueEmail();

    await changeEmail(page, newEmail, "no-es-la-actual");

    await expect(
      section(page, "Cambiar correo").getByText("La contraseña actual es incorrecta."),
    ).toBeVisible();
    await expect(section(page, "Cambiar correo").getByLabel("Correo nuevo")).toHaveValue(newEmail);
    expect(
      await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [account.email]),
    ).toHaveLength(1);
  });

  test("rechaza un correo que ya usa otra cuenta (RF-88)", async ({ page, request }) => {
    const other = await createAccount(request);
    const account = await openAccount(page, request);

    await changeEmail(page, other.email, account.password);

    await expect(
      section(page, "Cambiar correo").getByText("Ya existe una cuenta con ese correo."),
    ).toBeVisible();
    expect(
      await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [account.email]),
    ).toHaveLength(1);
  });

  test("rechaza un correo con formato inválido", async ({ page, request }) => {
    const account = await openAccount(page, request);

    await changeEmail(page, "no-es-un-correo", account.password);

    await expect(
      section(page, "Cambiar correo").getByText("Escribe un correo válido."),
    ).toBeVisible();
  });
});

test.describe("eliminación de cuenta", () => {
  test("el diálogo advierte cuántas ligas se eliminan y cancelar no borra nada (RF-91)", async ({
    page,
    request,
  }) => {
    const account = await openAccount(page, request);
    await createLeagueWithCrest(account.email, "IN_PROGRESS");
    await createLeagueWithCrest(account.email, "FINALIZED");
    await page.reload();

    await section(page, "Eliminar cuenta").getByRole("button", { name: "Eliminar cuenta" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(
      "También se eliminarán tus 2 ligas (1 en curso y 1 finalizada)",
    );
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    expect(
      await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [account.email]),
    ).toHaveLength(1);
  });

  test("sin ligas, el diálogo lo dice", async ({ page, request }) => {
    await openAccount(page, request);

    await section(page, "Eliminar cuenta").getByRole("button", { name: "Eliminar cuenta" }).click();

    await expect(page.getByRole("alertdialog")).toContainText(
      "No tienes ligas, así que solo se eliminará tu cuenta.",
    );
  });

  test("al confirmar borra la cuenta, sus ligas y escudos, y cierra todas sus sesiones (RF-92)", async ({
    page,
    request,
    browser,
  }) => {
    const account = await openAccount(page, request);
    const inProgress = await createLeagueWithCrest(account.email, "IN_PROGRESS");
    const finalized = await createLeagueWithCrest(account.email, "FINALIZED");
    const other = await signInOnOtherDevice(browser, account.email, account.password);
    await page.reload();

    await section(page, "Eliminar cuenta").getByRole("button", { name: "Eliminar cuenta" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar cuenta" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
    expect(
      (await page.context().cookies()).find((cookie) => cookie.name.endsWith("session_token")),
    ).toBeUndefined();
    expect(await queryDatabase('SELECT 1 FROM "user" WHERE email = $1', [account.email])).toEqual(
      [],
    );
    const leagueIds = [inProgress.leagueId, finalized.leagueId];
    const teamIds = [inProgress.teamId, finalized.teamId];
    expect(await queryDatabase("SELECT 1 FROM league WHERE id = ANY($1)", [leagueIds])).toEqual([]);
    expect(
      await queryDatabase('SELECT 1 FROM team_crest WHERE "teamId" = ANY($1)', [teamIds]),
    ).toEqual([]);
    await other.page.reload();
    await expect(other.page.getByRole("link", { name: "Ingresar" })).toBeVisible();
    await other.context.close();

    // La cuenta ya no existe: no se puede ingresar con ella.
    await signIn(page, account.email, account.password);
    await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
  });
});

test("la página de cuenta y su diálogo caben en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
  request,
}) => {
  await openAccount(page, request);
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

  expect(await scrollWidth()).toBeLessThanOrEqual(360);
  await section(page, "Eliminar cuenta").getByRole("button", { name: "Eliminar cuenta" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
});
