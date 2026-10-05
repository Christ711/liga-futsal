import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import {
  previousSemester,
  seedLeague,
  seedMatch,
  seedMatchday,
  seedPlayer,
  seedTeam,
} from "./helpers/leagues";

const SECTIONS = [
  ["Resumen", ""],
  ["Equipos", "/equipos"],
  ["Fechas", "/fechas"],
  ["Descuentos", "/descuentos"],
  ["Ajustes", "/ajustes"],
] as const;

/** Liga en curso con 3 equipos, un jugador cada uno y una fecha abierta. */
async function leagueWithOpenMatchday(page: Page, request: APIRequestContext) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const teams = [];
  for (const name of ["Tigres", "Leones", "Pumas"]) {
    const team = await seedTeam(league.id, name);
    await seedPlayer(league.id, team.id, `Jugador de ${name}`);
    teams.push(team);
  }
  const matchday = await seedMatchday(league.id, "2026-09-05");
  await seedMatch(matchday.id, { teamAId: teams[0]!.id, teamBId: teams[1]!.id });
  return { owner, league, matchday };
}

const menuButton = (page: Page) => page.getByRole("button", { name: "Menú de la liga" });
const leagueNav = (page: Page) => page.getByRole("navigation", { name: "Secciones de la liga" });

test.describe("menú de la liga a 360 px (plan D22)", () => {
  test("lleva a las cinco vistas y marca la actual", async ({ page, request }) => {
    const { league } = await leagueWithOpenMatchday(page, request);
    await page.goto(`/mis-ligas/${league.id}`);

    for (const [name, path] of SECTIONS) {
      await menuButton(page).click();
      await leagueNav(page).getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}${path}$`));
      await expect(leagueNav(page)).toBeHidden();
      await menuButton(page).click();
      await expect(leagueNav(page).getByRole("link", { name, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await page.keyboard.press("Escape");
      await expect(leagueNav(page)).toBeHidden();
    }
  });

  test("abierto o cerrado, no hay desplazamiento horizontal", async ({ page, request }) => {
    const { league } = await leagueWithOpenMatchday(page, request);
    await page.goto(`/mis-ligas/${league.id}/equipos`);
    const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

    expect(await scrollWidth()).toBeLessThanOrEqual(360);
    await menuButton(page).click();
    await expect(leagueNav(page)).toBeVisible();
    expect(await scrollWidth()).toBeLessThanOrEqual(360);
  });

  test("en la vista de una fecha el menú marca Fechas", async ({ page, request }) => {
    const { league, matchday } = await leagueWithOpenMatchday(page, request);
    await page.goto(`/mis-ligas/${league.id}/fechas/${matchday.id}`);

    await menuButton(page).click();

    await expect(
      leagueNav(page).getByRole("link", { name: "Fechas", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("una liga finalizada solo ofrece Resumen, Equipos y Ajustes", async ({ page, request }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email, { status: "FINALIZED" });
    await queryDatabase(
      `INSERT INTO league_snapshot ("leagueId", standings, "topScorers") VALUES ($1, '[]', '[]')`,
      [league.id],
    );
    await page.goto(`/mis-ligas/${league.id}`);

    await menuButton(page).click();

    await expect(leagueNav(page).getByRole("link")).toHaveText([
      "Resumen",
      "Equipos",
      "Ajustes",
      "Ver página pública",
    ]);
  });
});

test("en pantallas anchas el menú queda fijo, sin botón para abrirlo", async ({
  page,
  request,
}) => {
  const { league } = await leagueWithOpenMatchday(page, request);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto(`/mis-ligas/${league.id}/equipos`);

  await expect(leagueNav(page)).toBeVisible();
  await expect(menuButton(page)).toBeHidden();
  await leagueNav(page).getByRole("link", { name: "Fechas", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}/fechas$`));
  await expect(leagueNav(page)).toBeVisible();
});

test.describe("resumen de la liga", () => {
  test("muestra el estado y lleva a la fecha abierta en un toque", async ({ page, request }) => {
    const { league, matchday } = await leagueWithOpenMatchday(page, request);

    await page.goto(`/mis-ligas/${league.id}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(league.name);
    await expect(page.getByRole("main")).toContainText("En curso");
    await expect(page.getByRole("main")).toContainText("3 equipos · 3 jugadores · 1 fecha");
    await page.getByRole("link", { name: "Ir a la fecha" }).click();
    await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}/fechas/${matchday.id}$`));
  });

  test("copia el link público con un botón", async ({ page, request, context }) => {
    const { league } = await leagueWithOpenMatchday(page, request);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/mis-ligas/${league.id}`);

    await page.getByRole("button", { name: "Copiar link" }).click();

    await expect(page.getByRole("main").getByRole("status")).toHaveText("Link copiado");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(new URL(`/ligas/${league.id}`, page.url()).toString());
  });

  test("sin fecha abierta ofrece generar una", async ({ page, request }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    for (const name of ["Tigres", "Leones", "Pumas"]) await seedTeam(league.id, name);

    await page.goto(`/mis-ligas/${league.id}`);
    await page.getByRole("main").getByRole("link", { name: "Generar fecha" }).click();

    await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}/fechas$`));
  });

  test("en una liga de un semestre terminado avisa y lleva a finalizarla en Ajustes (RF-94)", async ({
    page,
    request,
  }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email, { semester: previousSemester() });

    await page.goto(`/mis-ligas/${league.id}`);

    await expect(page.getByRole("main")).toContainText("El semestre terminó");
    await page.getByRole("main").getByRole("link", { name: "Finalizar liga" }).click();
    await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}/ajustes#finalizar-liga$`));
    await expect(page.locator("#finalizar-liga")).toHaveText("Finalizar liga");
  });
});
