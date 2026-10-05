import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

import { createAccount, queryDatabase, signIn, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

/** Fecha abierta con 3 partidos: Tigres-Leones, Leones-Pumas y Tigres-Pumas. */
async function openMatchday(page: Page, request: APIRequestContext) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const tigres = await seedTeam(league.id, "Tigres");
  const leones = await seedTeam(league.id, "Leones");
  const pumas = await seedTeam(league.id, "Pumas");
  const juan = await seedPlayer(league.id, tigres.id, "Juan");
  const pedro = await seedPlayer(league.id, leones.id, "Pedro");
  const matchday = await seedMatchday(league.id, "2026-09-05");
  const first = await seedMatch(matchday.id, { teamAId: tigres.id, teamBId: leones.id });
  const second = await seedMatch(
    matchday.id,
    { teamAId: leones.id, teamBId: pumas.id },
    { position: 2 },
  );
  const third = await seedMatch(
    matchday.id,
    { teamAId: tigres.id, teamBId: pumas.id },
    { position: 3 },
  );
  const url = `/mis-ligas/${league.id}/fechas/${matchday.id}`;
  await page.goto(url);
  return { owner, league, matchday, url, tigres, leones, pumas, juan, pedro, first, second, third };
}

const matchCard = (page: Page, position: number) =>
  page.getByRole("listitem", { name: new RegExp(`^Partido ${position}:`) });

const score = (card: Locator, team: string) => card.getByLabel(`Goles de ${team}`);

async function seedGoal(matchId: string, teamId: string, scorerId: string | null) {
  await queryDatabase(
    `INSERT INTO goal (id, "matchId", "teamId", "scorerId") VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), matchId, teamId, scorerId],
  );
}

const goalsOf = (matchId: string) =>
  queryDatabase<{ teamId: string; scorerId: string | null }>(
    'SELECT "teamId", "scorerId" FROM goal WHERE "matchId" = $1 ORDER BY "createdAt"',
    [matchId],
  );

test("muestra los partidos en su orden con sus equipos, marcador y estado (RF-47, RF-52)", async ({
  page,
  request,
}) => {
  const { url, first, tigres, juan } = await openMatchday(page, request);
  await seedGoal(first.id, tigres.id, juan.id);
  await queryDatabase(`UPDATE match SET status = 'FINISHED' WHERE id = $1`, [first.id]);

  await page.goto(url);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fecha 1");
  await expect(matchCard(page, 1)).toHaveAccessibleName("Partido 1: Tigres contra Leones");
  await expect(matchCard(page, 2)).toHaveAccessibleName("Partido 2: Leones contra Pumas");
  await expect(matchCard(page, 3)).toHaveAccessibleName("Partido 3: Tigres contra Pumas");
  await expect(score(matchCard(page, 1), "Tigres")).toHaveText("1");
  await expect(score(matchCard(page, 1), "Leones")).toHaveText("0");
  await expect(matchCard(page, 1)).toContainText("Terminado");
  await expect(matchCard(page, 2)).toContainText("Pendiente");
});

test("desde la liga se llega a la vista de la fecha", async ({ page, request }) => {
  const { league, url } = await openMatchday(page, request);
  await page.goto(`/mis-ligas/${league.id}`);

  await page.getByRole("link", { name: /Fecha 1/ }).click();

  await expect(page).toHaveURL(new RegExp(`${url}$`));
});

test.describe("ruta GET de la fecha (RF-13; ADR 011)", () => {
  test("responde los datos al dueño", async ({ page, request }) => {
    const { league, matchday } = await openMatchday(page, request);

    const response = await page.request.get(`/api/leagues/${league.id}/matchdays/${matchday.id}`);

    expect(response.status()).toBe(200);
    expect((await response.json()).matches).toHaveLength(3);
  });

  test("responde 401 sin sesión y 403 a otro ayudante", async ({
    page,
    request,
    browser,
    playwright,
  }) => {
    const { league, matchday } = await openMatchday(page, request);
    const path = `/api/leagues/${league.id}/matchdays/${matchday.id}`;

    // El contexto `request` ya tiene la sesión de la cuenta creada por la API.
    const anonymous = await playwright.request.newContext({
      baseURL: test.info().project.use.baseURL,
    });
    expect((await anonymous.get(path)).status()).toBe(401);
    await anonymous.dispose();
    const other = await createAccount(request);
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await signIn(otherPage, other.email, other.password);
    await otherPage.getByRole("button", { name: "Cerrar sesión" }).waitFor();
    expect((await otherPage.request.get(path)).status()).toBe(403);
    await otherContext.close();
  });
});

test("sube un partido una posición y el orden persiste al recargar (RF-46)", async ({
  page,
  request,
}) => {
  const { url } = await openMatchday(page, request);

  await matchCard(page, 2).getByRole("button", { name: "Subir partido" }).click();

  await expect(matchCard(page, 1)).toHaveAccessibleName("Partido 1: Leones contra Pumas");
  await expect(matchCard(page, 2)).toHaveAccessibleName("Partido 2: Tigres contra Leones");
  await page.waitForLoadState("networkidle");
  await page.goto(url);
  await expect(matchCard(page, 1)).toHaveAccessibleName("Partido 1: Leones contra Pumas");
  await expect(matchCard(page, 1).getByRole("button", { name: "Subir partido" })).toBeDisabled();
});

test.describe("anotar goles (RF-53 a RF-56; RNF-1)", () => {
  test("anota un gol en 2 toques, lo ve al instante y persiste al recargar", async ({
    page,
    request,
  }) => {
    const { url, first, tigres, juan } = await openMatchday(page, request);
    const card = matchCard(page, 1);

    // Toque 1: agregar gol en el partido.
    await card.getByRole("button", { name: "Agregar gol" }).click();
    const sheet = page.getByRole("dialog", { name: "Gol en Tigres contra Leones" });
    await expect(sheet.getByRole("button", { name: "Juan", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Pedro", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Gol sin autor de Tigres" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Gol sin autor de Leones" })).toBeVisible();
    // Toque 2: elegir al autor. No hay paso de confirmación.
    await sheet.getByRole("button", { name: "Juan", exact: true }).click();

    await expect(sheet).toBeHidden();
    await expect(score(card, "Tigres")).toHaveText("1");
    await expect.poll(() => goalsOf(first.id)).toEqual([{ teamId: tigres.id, scorerId: juan.id }]);
    await page.goto(url);
    await expect(score(matchCard(page, 1), "Tigres")).toHaveText("1");
  });

  test("un gol sin autor suma al marcador del equipo elegido", async ({ page, request }) => {
    const { first, leones } = await openMatchday(page, request);
    const card = matchCard(page, 1);

    await card.getByRole("button", { name: "Agregar gol" }).click();
    await page
      .getByRole("dialog", { name: "Gol en Tigres contra Leones" })
      .getByRole("button", { name: "Gol sin autor de Leones" })
      .click();

    await expect(score(card, "Leones")).toHaveText("1");
    await expect(score(card, "Tigres")).toHaveText("0");
    await expect.poll(() => goalsOf(first.id)).toEqual([{ teamId: leones.id, scorerId: null }]);
  });

  test("varios goles seguidos se registran todos", async ({ page, request }) => {
    const { first } = await openMatchday(page, request);
    const card = matchCard(page, 1);

    for (const name of ["Juan", "Juan", "Pedro"]) {
      await card.getByRole("button", { name: "Agregar gol" }).click();
      await page
        .getByRole("dialog", { name: "Gol en Tigres contra Leones" })
        .getByRole("button", { name, exact: true })
        .click();
    }

    await expect(score(card, "Tigres")).toHaveText("2");
    await expect(score(card, "Leones")).toHaveText("1");
    await expect.poll(async () => (await goalsOf(first.id)).length).toBe(3);
  });
});

test("quita un gol y reasigna otro a un jugador del otro equipo (RF-57)", async ({
  page,
  request,
}) => {
  const { url, first, tigres, leones, juan, pedro } = await openMatchday(page, request);
  await seedGoal(first.id, tigres.id, juan.id);
  await seedGoal(first.id, tigres.id, juan.id);
  await page.goto(url);
  const card = matchCard(page, 1);
  await expect(score(card, "Tigres")).toHaveText("2");

  await card.getByText("Goles (2)").click();
  const goals = card.getByRole("list", { name: "Goles del partido" }).getByRole("listitem");
  await goals.first().getByRole("button", { name: "Quitar" }).click();
  await expect(score(card, "Tigres")).toHaveText("1");
  await goals.first().getByRole("button", { name: "Reasignar" }).click();
  await page
    .getByRole("dialog", { name: "Reasignar gol de Juan" })
    .getByRole("button", { name: "Pedro", exact: true })
    .click();

  await expect(score(card, "Tigres")).toHaveText("0");
  await expect(score(card, "Leones")).toHaveText("1");
  await expect.poll(() => goalsOf(first.id)).toEqual([{ teamId: leones.id, scorerId: pedro.id }]);
});

test("termina un partido y lo devuelve a pendiente (RF-58, RF-84)", async ({ page, request }) => {
  const { url, first } = await openMatchday(page, request);
  const card = matchCard(page, 1);

  await card.getByRole("button", { name: "Terminar partido" }).click();
  await expect(card).toContainText("Terminado");
  await expect
    .poll(
      async () =>
        (
          await queryDatabase<{ status: string }>("SELECT status FROM match WHERE id = $1", [
            first.id,
          ])
        )[0]!.status,
    )
    .toBe("FINISHED");

  await card.getByRole("button", { name: "Devolver a pendiente" }).click();
  await expect(card).toContainText("Pendiente");
  await page.waitForLoadState("networkidle");
  await page.goto(url);
  await expect(matchCard(page, 1)).toContainText("Pendiente");
});

test("un partido bloqueado se ve sin acciones (RF-103)", async ({ page, request }) => {
  const { url, first } = await openMatchday(page, request);
  await queryDatabase(`UPDATE match SET status = 'FINISHED', locked = true WHERE id = $1`, [
    first.id,
  ]);

  await page.goto(url);

  const card = matchCard(page, 1);
  await expect(card).toContainText("Bloqueado");
  await expect(card.getByRole("button", { name: "Agregar gol" })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Devolver a pendiente" })).toHaveCount(0);
});

test("una fecha de otra liga responde 404", async ({ page, request }) => {
  const { league } = await openMatchday(page, request);
  const other = await createAccount(request);
  const foreignLeague = await seedLeague(other.email);
  const foreign = await seedMatchday(foreignLeague.id, "2026-09-05");

  const response = await page.goto(`/mis-ligas/${league.id}/fechas/${foreign.id}`);

  expect(response?.status()).toBe(404);
});

test("la vista de la fecha y el panel de goles caben en 360 px (RNF-3)", async ({
  page,
  request,
}) => {
  await openMatchday(page, request);
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

  expect(await scrollWidth()).toBeLessThanOrEqual(360);
  await matchCard(page, 1).getByRole("button", { name: "Agregar gol" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
});
