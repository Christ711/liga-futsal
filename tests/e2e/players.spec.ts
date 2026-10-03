import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedGoal, seedLeague, seedPlayer, seedTeam } from "./helpers/leagues";

const HAS_GOALS =
  "El jugador tiene goles registrados y no se puede eliminar. Puedes editar su nombre.";

const teamItem = (page: Page, name: string) =>
  page.getByRole("region", { name: "Equipos" }).getByRole("listitem", { name, exact: true });

/** Abre un equipo y devuelve su región de jugadores. */
async function openPlayers(page: Page, team: string) {
  const item = teamItem(page, team);
  await item.locator("summary").first().click();
  return item.getByRole("region", { name: "Jugadores" });
}

const playerItem = (players: ReturnType<Page["getByRole"]>, name: string) =>
  players.getByRole("listitem", { name, exact: true });

async function openPlayer(players: ReturnType<Page["getByRole"]>, name: string) {
  const item = playerItem(players, name);
  await item.locator("summary").click();
  return item;
}

async function addPlayer(players: ReturnType<Page["getByRole"]>, name: string) {
  await players.getByLabel("Nuevo jugador").fill(name);
  await players.getByRole("button", { name: "Agregar jugador" }).click();
}

/** Liga en curso con Tigres y Leones, abierta en su administración. */
async function openLeague(page: Page, request: APIRequestContext) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const tigres = await seedTeam(league.id, "Tigres");
  const leones = await seedTeam(league.id, "Leones");
  return { league, tigres, leones };
}

const playersOf = async (teamId: string) =>
  (
    await queryDatabase<{ name: string }>(
      'SELECT name FROM player WHERE "teamId" = $1 ORDER BY name',
      [teamId],
    )
  ).map((row) => row.name);

test.describe("agregar y editar jugadores", () => {
  test("agrega jugadores a un equipo indicando solo su nombre (RF-33)", async ({
    page,
    request,
  }) => {
    const { league, tigres } = await openLeague(page, request);
    await page.goto(`/mis-ligas/${league.id}`);

    const players = await openPlayers(page, "Tigres");
    await addPlayer(players, "  Ana Pérez ");
    await expect(playerItem(players, "Ana Pérez")).toBeVisible();
    await addPlayer(players, "Beto Soto");

    await expect(playerItem(players, "Beto Soto")).toBeVisible();
    await expect(players.getByLabel("Nuevo jugador")).toHaveValue("");
    await expect(teamItem(page, "Tigres").locator("summary").first()).toContainText("2 jugadores");
    expect(await playersOf(tigres.id)).toEqual(["Ana Pérez", "Beto Soto"]);
  });

  test("renombra un jugador (RF-34)", async ({ page, request }) => {
    const { league, tigres } = await openLeague(page, request);
    await seedPlayer(league.id, tigres.id, "Ana Pérez");
    await page.goto(`/mis-ligas/${league.id}`);

    const players = await openPlayers(page, "Tigres");
    const item = await openPlayer(players, "Ana Pérez");
    await item.getByLabel("Nombre del jugador").fill("Ana María Pérez");
    await item.getByRole("button", { name: "Guardar nombre" }).click();

    await expect(playerItem(players, "Ana María Pérez")).toBeVisible();
    expect(await playersOf(tigres.id)).toEqual(["Ana María Pérez"]);
  });

  test("rechaza un nombre que ya usa un jugador de otro equipo de la liga (RF-35)", async ({
    page,
    request,
  }) => {
    const { league, tigres, leones } = await openLeague(page, request);
    await seedPlayer(league.id, leones.id, "Juan Soto");
    await page.goto(`/mis-ligas/${league.id}`);

    const players = await openPlayers(page, "Tigres");
    await addPlayer(players, "JUAN SOTO");

    await expect(
      players.getByText("Ya existe un jugador con ese nombre en la liga."),
    ).toBeVisible();
    await expect(players.getByLabel("Nuevo jugador")).toHaveValue("JUAN SOTO");
    expect(await playersOf(tigres.id)).toEqual([]);
  });

  test("rechaza un nombre vacío o de 41 caracteres (RF-36)", async ({ page, request }) => {
    const { league, tigres } = await openLeague(page, request);
    await page.goto(`/mis-ligas/${league.id}`);
    const players = await openPlayers(page, "Tigres");

    await addPlayer(players, "  ");
    await expect(players.getByText("Escribe un nombre.")).toBeVisible();
    await addPlayer(players, "x".repeat(41));
    await expect(players.getByText("Usa como máximo 40 caracteres.")).toBeVisible();

    expect(await playersOf(tigres.id)).toEqual([]);
  });
});

test.describe("eliminar jugadores", () => {
  test("elimina un jugador sin goles (RF-38)", async ({ page, request }) => {
    const { league, tigres } = await openLeague(page, request);
    await seedPlayer(league.id, tigres.id, "Ana Pérez");
    await page.goto(`/mis-ligas/${league.id}`);

    const players = await openPlayers(page, "Tigres");
    const item = await openPlayer(players, "Ana Pérez");
    await item.getByRole("button", { name: "Eliminar jugador" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("¿Eliminar a Ana Pérez?");
    await dialog.getByRole("button", { name: "Eliminar jugador" }).click();

    await expect(dialog).toBeHidden();
    await expect(playerItem(players, "Ana Pérez")).toHaveCount(0);
    expect(await playersOf(tigres.id)).toEqual([]);
  });

  test("a un jugador con goles no lo elimina y sugiere editar su nombre (RF-37)", async ({
    page,
    request,
  }) => {
    const { league, tigres, leones } = await openLeague(page, request);
    const player = await seedPlayer(league.id, tigres.id, "Goleador");
    await seedGoal(
      league.id,
      { teamAId: tigres.id, teamBId: leones.id },
      { id: player.id, teamId: tigres.id },
    );
    await page.goto(`/mis-ligas/${league.id}`);

    const players = await openPlayers(page, "Tigres");
    const item = await openPlayer(players, "Goleador");
    await item.getByRole("button", { name: "Eliminar jugador" }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Eliminar jugador" }).click();

    await expect(dialog.getByRole("alert")).toHaveText(HAS_GOALS);
    expect(await playersOf(tigres.id)).toEqual(["Goleador"]);
  });
});

test("traspasa un jugador a otro equipo de la liga (RF-39)", async ({ page, request }) => {
  const { league, tigres, leones } = await openLeague(page, request);
  await seedPlayer(league.id, tigres.id, "Ana Pérez");
  await page.goto(`/mis-ligas/${league.id}`);

  const players = await openPlayers(page, "Tigres");
  const item = await openPlayer(players, "Ana Pérez");
  await item.getByLabel("Traspasar a").selectOption({ label: "Leones" });
  await item.getByRole("button", { name: "Traspasar" }).click();

  await expect(playerItem(players, "Ana Pérez")).toHaveCount(0);
  const leonesPlayers = await openPlayers(page, "Leones");
  await expect(playerItem(leonesPlayers, "Ana Pérez")).toBeVisible();
  expect(await playersOf(tigres.id)).toEqual([]);
  expect(await playersOf(leones.id)).toEqual(["Ana Pérez"]);
});

test("en una liga finalizada la lista de jugadores se ve pero no se edita (RF-76)", async ({
  page,
  request,
}) => {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email, { status: "FINALIZED" });
  const team = await seedTeam(league.id, "Tigres");
  await seedPlayer(league.id, team.id, "Ana Pérez");
  await page.goto(`/mis-ligas/${league.id}`);

  const players = await openPlayers(page, "Tigres");

  await expect(players.getByText("Ana Pérez")).toBeVisible();
  await expect(players.getByLabel("Nuevo jugador")).toHaveCount(0);
  await expect(players.locator("summary")).toHaveCount(0);
});

test("un equipo abierto con un jugador en edición cabe en 360 px (RNF-3)", async ({
  page,
  request,
}) => {
  const { league, tigres } = await openLeague(page, request);
  await seedPlayer(league.id, tigres.id, "Bartolomé Fernández Riquelme Undurraga");
  await page.goto(`/mis-ligas/${league.id}`);

  const players = await openPlayers(page, "Tigres");
  await openPlayer(players, "Bartolomé Fernández Riquelme Undurraga");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
