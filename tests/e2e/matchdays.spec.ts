import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedTeam, todayInSantiago } from "./helpers/leagues";

const section = (page: Page) => page.getByRole("region", { name: "Fechas" });

/** Fecha de la lista por su número, por ejemplo "Fecha 2". */
const matchdayItem = (page: Page, number: number) =>
  section(page).getByRole("listitem", { name: `Fecha ${number}`, exact: true });

/** Liga en curso con la cantidad de equipos pedida. */
async function leagueWithTeams(page: Page, request: APIRequestContext, teamCount = 3) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const teams = [];
  for (const name of ["Tigres", "Leones", "Halcones", "Pumas"].slice(0, teamCount)) {
    teams.push(await seedTeam(league.id, name));
  }
  return { league, teams };
}

async function generate(page: Page, playDate?: string) {
  await section(page).getByRole("button", { name: "Generar fecha" }).click();
  const dialog = page.getByRole("dialog", { name: "Generar fecha" });
  if (playDate) await dialog.getByLabel("Día de juego").fill(playDate);
  await dialog.getByRole("button", { name: "Generar fecha" }).click();
  return dialog;
}

test.describe("generar una fecha (RF-42, RF-43, RF-48, RF-97)", () => {
  test("el diálogo propone el día de hoy", async ({ page, request }) => {
    const { league } = await leagueWithTeams(page, request);
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    await section(page).getByRole("button", { name: "Generar fecha" }).click();

    await expect(
      page.getByRole("dialog", { name: "Generar fecha" }).getByLabel("Día de juego"),
    ).toHaveValue(todayInSantiago());
  });

  test("la fecha creada aparece con su número, su día y el estado Abierta", async ({
    page,
    request,
  }) => {
    const { league } = await leagueWithTeams(page, request);
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    const dialog = await generate(page, "2026-10-03");

    await expect(dialog).toBeHidden();
    await expect(matchdayItem(page, 1)).toContainText("sábado 3 de octubre de 2026");
    await expect(matchdayItem(page, 1)).toContainText("Abierta");
    const matches = await queryDatabase(
      'SELECT 1 FROM match m JOIN matchday d ON d.id = m."matchdayId" WHERE d."leagueId" = $1',
      [league.id],
    );
    expect(matches).toHaveLength(3);
  });

  test("una fecha con un día entre dos existentes toma el número intermedio (RF-43)", async ({
    page,
    request,
  }) => {
    const { league } = await leagueWithTeams(page, request);
    await seedMatchday(league.id, "2026-09-05", { finalized: true });
    await seedMatchday(league.id, "2026-09-19", { finalized: true });
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    await generate(page, "2026-09-12");

    await expect(matchdayItem(page, 2)).toContainText("sábado 12 de septiembre de 2026");
    await expect(matchdayItem(page, 2)).toContainText("Abierta");
    await expect(matchdayItem(page, 1)).toContainText("5 de septiembre");
    await expect(matchdayItem(page, 3)).toContainText("19 de septiembre");
  });

  test("rechaza un día que ya tiene otra fecha (RF-99)", async ({ page, request }) => {
    const { league } = await leagueWithTeams(page, request);
    await seedMatchday(league.id, "2026-09-05", { finalized: true });
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    const dialog = await generate(page, "2026-09-05");

    await expect(dialog.getByText("Ya hay una fecha de la liga ese día.")).toBeVisible();
    await expect(matchdayItem(page, 2)).toHaveCount(0);
  });

  test("con menos de 3 equipos no deja generar e indica el mínimo (RF-41)", async ({
    page,
    request,
  }) => {
    const { league } = await leagueWithTeams(page, request, 2);

    await page.goto(`/mis-ligas/${league.id}/fechas`);

    await expect(section(page)).toContainText(
      "Se necesitan al menos 3 equipos para generar una fecha.",
    );
    await expect(section(page).getByRole("button", { name: "Generar fecha" })).toBeDisabled();
  });

  test("con una fecha abierta no deja generar otra (RF-100)", async ({ page, request }) => {
    const { league } = await leagueWithTeams(page, request);
    await seedMatchday(league.id, "2026-09-05");

    await page.goto(`/mis-ligas/${league.id}/fechas`);

    await expect(section(page)).toContainText("Hay una fecha abierta. Primero finaliza esa fecha.");
    await expect(section(page).getByRole("button", { name: "Generar fecha" })).toBeDisabled();
  });
});

test("muestra las fechas incompletas con sus pendientes y las finalizadas (RF-104, RF-105)", async ({
  page,
  request,
}) => {
  const { league, teams } = await leagueWithTeams(page, request);
  const [tigres, leones, halcones] = teams;
  const incomplete = await seedMatchday(league.id, "2026-09-05", { finalized: true });
  await seedMatch(incomplete.id, { teamAId: tigres!.id, teamBId: leones!.id }, { finished: true });
  await seedMatch(incomplete.id, { teamAId: leones!.id, teamBId: halcones!.id }, { position: 2 });
  await seedMatch(incomplete.id, { teamAId: tigres!.id, teamBId: halcones!.id }, { position: 3 });
  const finalized = await seedMatchday(league.id, "2026-09-12", { finalized: true });
  await seedMatch(finalized.id, { teamAId: tigres!.id, teamBId: leones!.id }, { finished: true });

  await page.goto(`/mis-ligas/${league.id}/fechas`);

  await expect(matchdayItem(page, 1)).toContainText("Incompleta (2)");
  await expect(matchdayItem(page, 2)).toContainText("Finalizada");
});

test.describe("cambiar el día de una fecha (RF-43, RF-98, RF-99)", () => {
  async function changeDay(page: Page, number: number, playDate: string) {
    const item = matchdayItem(page, number);
    await item.locator("summary").click();
    await item.getByLabel("Día de juego").fill(playDate);
    await item.getByRole("button", { name: "Cambiar día" }).click();
    return item;
  }

  test("cambiar el día reordena la numeración", async ({ page, request }) => {
    const { league } = await leagueWithTeams(page, request);
    await seedMatchday(league.id, "2026-09-05", { finalized: true });
    await seedMatchday(league.id, "2026-09-12", { finalized: true });
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    await changeDay(page, 1, "2026-09-26");

    await expect(matchdayItem(page, 2)).toContainText("26 de septiembre");
    await expect(matchdayItem(page, 1)).toContainText("12 de septiembre");
  });

  test("rechaza el día de otra fecha de la liga", async ({ page, request }) => {
    const { league } = await leagueWithTeams(page, request);
    await seedMatchday(league.id, "2026-09-05", { finalized: true });
    await seedMatchday(league.id, "2026-09-12", { finalized: true });
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    const item = await changeDay(page, 1, "2026-09-12");

    await expect(item.getByText("Ya hay una fecha de la liga ese día.")).toBeVisible();
    await page.reload();
    await expect(matchdayItem(page, 1)).toContainText("5 de septiembre");
  });
});

test.describe("eliminar una fecha (RF-50, RF-51)", () => {
  test("el diálogo cuenta los partidos terminados y al confirmar se renumeran las demás", async ({
    page,
    request,
  }) => {
    const { league, teams } = await leagueWithTeams(page, request);
    const [tigres, leones, halcones] = teams;
    const first = await seedMatchday(league.id, "2026-09-05", { finalized: true });
    await seedMatch(first.id, { teamAId: tigres!.id, teamBId: leones!.id }, { finished: true });
    await seedMatch(
      first.id,
      { teamAId: leones!.id, teamBId: halcones!.id },
      { position: 2, finished: true },
    );
    await seedMatch(first.id, { teamAId: tigres!.id, teamBId: halcones!.id }, { position: 3 });
    await seedMatchday(league.id, "2026-09-12");
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    const item = matchdayItem(page, 1);
    await item.locator("summary").click();
    await item.getByRole("button", { name: "Eliminar fecha" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Se perderán 2 partidos terminados con sus goles");
    await dialog.getByRole("button", { name: "Eliminar fecha" }).click();

    await expect(dialog).toBeHidden();
    await expect(matchdayItem(page, 1)).toContainText("12 de septiembre");
    await expect(matchdayItem(page, 2)).toHaveCount(0);
    expect(await queryDatabase('SELECT 1 FROM match WHERE "matchdayId" = $1', [first.id])).toEqual(
      [],
    );
  });

  test("una fecha sin partidos terminados lo dice en el diálogo", async ({ page, request }) => {
    const { league } = await leagueWithTeams(page, request);
    await seedMatchday(league.id, "2026-09-05");
    await page.goto(`/mis-ligas/${league.id}/fechas`);

    const item = matchdayItem(page, 1);
    await item.locator("summary").click();
    await item.getByRole("button", { name: "Eliminar fecha" }).click();

    await expect(page.getByRole("alertdialog")).toContainText("No tiene partidos terminados.");
  });
});

test("la sección de fechas y su diálogo caben en 360 px (RNF-3)", async ({ page, request }) => {
  const { league } = await leagueWithTeams(page, request);
  await seedMatchday(league.id, "2026-09-05", { finalized: true });
  await page.goto(`/mis-ligas/${league.id}/fechas`);
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

  await matchdayItem(page, 1).locator("summary").click();
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
  await section(page).getByRole("button", { name: "Generar fecha" }).click();
  await expect(page.getByRole("dialog", { name: "Generar fecha" })).toBeVisible();
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
});
