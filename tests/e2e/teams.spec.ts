import { expect, test, type Page } from "@playwright/test";

import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

const LOCKED = "La liga ya tiene fechas: no se pueden agregar ni eliminar equipos.";

const teamsSection = (page: Page) => page.getByRole("region", { name: "Equipos" });

const teamItem = (page: Page, name: string) =>
  teamsSection(page).getByRole("listitem", { name, exact: true });

const teamDetails = (item: ReturnType<typeof teamItem>) =>
  item.getByRole("region", { name: "Datos del equipo" });

async function openTeam(page: Page, name: string) {
  const item = teamItem(page, name);
  await item.locator("summary").first().click();
  return item;
}

async function addTeam(page: Page, name: string) {
  await teamsSection(page).getByLabel("Nuevo equipo").fill(name);
  await teamsSection(page).getByRole("button", { name: "Agregar equipo" }).click();
}

/** Liga en curso de un ayudante con sesión, con su página de administración abierta. */
async function openLeague(page: Page, request: import("@playwright/test").APIRequestContext) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  await page.goto(`/mis-ligas/${league.id}`);
  return league;
}

const teamNames = async (leagueId: string) =>
  (
    await queryDatabase<{ name: string }>(
      'SELECT name FROM team WHERE "leagueId" = $1 ORDER BY name',
      [leagueId],
    )
  ).map((row) => row.name);

test.describe("agregar y eliminar equipos (RF-23)", () => {
  test("agrega equipos, que aparecen con el escudo genérico de su inicial (RF-31)", async ({
    page,
    request,
  }) => {
    const league = await openLeague(page, request);

    await addTeam(page, "  Los Tigres ");
    await expect(teamItem(page, "Los Tigres")).toBeVisible();
    await addTeam(page, "Halcones");

    await expect(teamItem(page, "Halcones")).toBeVisible();
    await expect(teamsSection(page).getByLabel("Nuevo equipo")).toHaveValue("");
    await expect(
      teamItem(page, "Los Tigres").getByRole("img", { name: "Escudo genérico de Los Tigres" }),
    ).toHaveText("L");
    expect(await teamNames(league.id)).toEqual(["Halcones", "Los Tigres"]);
  });

  test("rechaza un nombre que ya usa otro equipo de la liga (RF-26)", async ({ page, request }) => {
    const league = await openLeague(page, request);
    await seedTeam(league.id, "Los Tigres");
    await page.reload();

    await addTeam(page, " los tigres ");

    await expect(
      teamsSection(page).getByText("Ya existe un equipo con ese nombre en la liga."),
    ).toBeVisible();
    await expect(teamsSection(page).getByLabel("Nuevo equipo")).toHaveValue(" los tigres ");
    expect(await teamNames(league.id)).toEqual(["Los Tigres"]);
  });

  test("rechaza un nombre vacío o de 31 caracteres (RF-27)", async ({ page, request }) => {
    const league = await openLeague(page, request);

    await addTeam(page, " ");
    await expect(teamsSection(page).getByText("Escribe un nombre.")).toBeVisible();
    await addTeam(page, "x".repeat(31));
    await expect(teamsSection(page).getByText("Usa como máximo 30 caracteres.")).toBeVisible();

    expect(await teamNames(league.id)).toEqual([]);
  });

  test("eliminar un equipo advierte cuántos jugadores se borran con él (RF-95, RF-96)", async ({
    page,
    request,
  }) => {
    const league = await openLeague(page, request);
    const team = await seedTeam(league.id, "Los Tigres");
    await seedPlayer(league.id, team.id, "Ana Pérez");
    await seedPlayer(league.id, team.id, "Beto Soto");
    await seedTeam(league.id, "Halcones");
    await page.reload();

    const item = await openTeam(page, "Los Tigres");
    await item.getByRole("button", { name: "Eliminar equipo" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("¿Eliminar Los Tigres?");
    await expect(dialog).toContainText("También se eliminarán sus 2 jugadores.");
    await dialog.getByRole("button", { name: "Eliminar equipo" }).click();

    // Con el diálogo abierto el resto de la página queda oculto a los lectores de pantalla.
    await expect(dialog).toBeHidden();
    await expect(teamItem(page, "Los Tigres")).toHaveCount(0);
    expect(await teamNames(league.id)).toEqual(["Halcones"]);
    expect(await queryDatabase('SELECT 1 FROM player WHERE "teamId" = $1', [team.id])).toEqual([]);
  });

  test("un equipo sin jugadores lo dice en el diálogo", async ({ page, request }) => {
    const league = await openLeague(page, request);
    await seedTeam(league.id, "Halcones");
    await page.reload();

    const item = await openTeam(page, "Halcones");
    await item.getByRole("button", { name: "Eliminar equipo" }).click();

    await expect(page.getByRole("alertdialog")).toContainText("El equipo no tiene jugadores.");
  });

  test("con una fecha creada ya no ofrece agregar ni eliminar equipos, pero sí editarlos (RF-24, RF-25)", async ({
    page,
    request,
  }) => {
    const league = await openLeague(page, request);
    await seedTeam(league.id, "Los Tigres");
    await seedMatchday(league.id);
    await page.reload();

    await expect(teamsSection(page)).toContainText(LOCKED);
    await expect(teamsSection(page).getByLabel("Nuevo equipo")).toHaveCount(0);
    const item = await openTeam(page, "Los Tigres");
    await expect(item.getByRole("button", { name: "Eliminar equipo" })).toHaveCount(0);
    await expect(teamDetails(item).getByRole("button", { name: "Guardar nombre" })).toBeVisible();
  });
});

test.describe("editar el nombre de un equipo (RF-25)", () => {
  test("renombra un equipo", async ({ page, request }) => {
    const league = await openLeague(page, request);
    await seedTeam(league.id, "Los Tigres");
    await page.reload();

    const item = await openTeam(page, "Los Tigres");
    await teamDetails(item).getByLabel("Nombre del equipo").fill("Tigres del Sur");
    await teamDetails(item).getByRole("button", { name: "Guardar nombre" }).click();

    await expect(teamItem(page, "Tigres del Sur")).toBeVisible();
    expect(await teamNames(league.id)).toEqual(["Tigres del Sur"]);
  });

  test("rechaza el nombre de otro equipo de la liga (RF-26)", async ({ page, request }) => {
    const league = await openLeague(page, request);
    await seedTeam(league.id, "Los Tigres");
    await seedTeam(league.id, "Halcones");
    await page.reload();

    const item = await openTeam(page, "Los Tigres");
    await teamDetails(item).getByLabel("Nombre del equipo").fill("HALCONES");
    await teamDetails(item).getByRole("button", { name: "Guardar nombre" }).click();

    await expect(item.getByText("Ya existe un equipo con ese nombre en la liga.")).toBeVisible();
    expect(await teamNames(league.id)).toEqual(["Halcones", "Los Tigres"]);
  });
});

test("en una liga finalizada los equipos se ven pero no se editan (RF-76)", async ({
  page,
  request,
}) => {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email, { status: "FINALIZED" });
  await seedTeam(league.id, "Los Tigres");

  await page.goto(`/mis-ligas/${league.id}`);

  const item = teamItem(page, "Los Tigres");
  await item.locator("summary").first().click();
  await expect(item.getByRole("region", { name: "Jugadores" })).toBeVisible();
  await expect(teamDetails(item)).toHaveCount(0);
  await expect(teamsSection(page).getByLabel("Nuevo equipo")).toHaveCount(0);
});

test("la sección de equipos cabe en 360 px con un equipo abierto (RNF-3)", async ({
  page,
  request,
}) => {
  const league = await openLeague(page, request);
  await seedTeam(league.id, "Deportivo Universitario Sur 12");
  await page.reload();

  await openTeam(page, "Deportivo Universitario Sur 12");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
