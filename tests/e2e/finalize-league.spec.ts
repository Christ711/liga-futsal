import { expect, test } from "@playwright/test";

import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

/** Liga del ayudante con sesión: Tigres 1-0 Leones terminado y dos partidos pendientes. */
async function leagueToFinalize(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const tigres = await seedTeam(league.id, "Tigres");
  const leones = await seedTeam(league.id, "Leones");
  const pumas = await seedTeam(league.id, "Pumas");
  const juan = await seedPlayer(league.id, tigres.id, "Juan");
  await seedPlayer(league.id, leones.id, "Pedro");
  const matchday = await seedMatchday(league.id, "2026-09-05");
  const played = await seedMatch(
    matchday.id,
    { teamAId: tigres.id, teamBId: leones.id },
    { finished: true },
  );
  await seedMatch(matchday.id, { teamAId: leones.id, teamBId: pumas.id }, { position: 2 });
  await seedMatch(matchday.id, { teamAId: tigres.id, teamBId: pumas.id }, { position: 3 });
  await queryDatabase(
    `INSERT INTO goal (id, "matchId", "teamId", "scorerId") VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), played.id, tigres.id, juan.id],
  );
  return { owner, league };
}

async function finalize(page: import("@playwright/test").Page) {
  const section = page.getByRole("region", { name: "Finalizar liga" });
  await section.getByRole("button", { name: "Finalizar liga" }).click();
  return page.getByRole("alertdialog");
}

test("el diálogo advierte que no se puede deshacer y cuántos pendientes se descartan; al confirmar pasa a finalizadas (RF-73)", async ({
  page,
  request,
}) => {
  const { league } = await leagueToFinalize(page, request);
  await page.goto(`/mis-ligas/${league.id}/ajustes`);

  const dialog = await finalize(page);
  await expect(dialog).toContainText("Esta acción no se puede deshacer.");
  await expect(dialog).toContainText(
    "Se descartarán 2 partidos pendientes, que no contarán en las tablas finales.",
  );
  await dialog.getByRole("button", { name: "Finalizar liga" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("region", { name: "Finalizar liga" })).toHaveCount(0);
  await page.goto(`/mis-ligas/${league.id}`);
  await expect(page.getByRole("main")).toContainText("Finalizada");
  await page.goto("/mis-ligas");
  await expect(
    page.getByRole("region", { name: "Finalizadas", exact: true }).getByRole("link", {
      name: league.name,
    }),
  ).toBeVisible();
});

test("los enlaces a finalizar la liga llevan a su sección", async ({ page, request }) => {
  const { league } = await leagueToFinalize(page, request);

  await page.goto(`/mis-ligas/${league.id}/ajustes#finalizar-liga`);

  await expect(page.locator("#finalizar-liga")).toHaveText("Finalizar liga");
});

test("la vista pública de la liga finalizada muestra la tabla final, los goleadores con su equipo y los equipos con sus jugadores (RF-82)", async ({
  page,
  request,
  browser,
}) => {
  const { league } = await leagueToFinalize(page, request);
  await page.goto(`/mis-ligas/${league.id}/ajustes`);
  await (await finalize(page)).getByRole("button", { name: "Finalizar liga" }).click();
  await expect(page.getByRole("region", { name: "Finalizar liga" })).toHaveCount(0);

  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto("/");
  await publicPage
    .getByRole("region", { name: "Historial", exact: true })
    .getByRole("link", { name: league.name })
    .click();

  await expect(publicPage).toHaveURL(new RegExp(`/ligas/${league.id}$`));
  await expect(publicPage.getByRole("main")).toContainText("Finalizada");
  const standings = publicPage.getByRole("table", { name: "Tabla de posiciones" });
  await expect(standings.getByRole("row")).toHaveCount(4);
  await expect(standings.getByRole("row").nth(1)).toContainText("Tigres");
  await expect(standings.getByRole("row").nth(1).getByRole("cell").last()).toHaveText("3");
  const scorers = publicPage.getByRole("table", { name: "Goleadores" });
  await expect(scorers.getByRole("row").nth(1)).toContainText("Juan");
  await expect(scorers.getByRole("row").nth(1)).toContainText("Tigres");
  const teams = publicPage.getByRole("region", { name: "Equipos", exact: true });
  const tigres = teams.getByRole("listitem", { name: "Tigres", exact: true });
  await expect(tigres.getByRole("img", { name: "Escudo genérico de Tigres" })).toBeVisible();
  await expect(tigres).toContainText("Juan");
  await expect(teams.getByRole("listitem", { name: "Leones", exact: true })).toContainText("Pedro");
  await expect(publicPage.getByText("Fecha 1")).toHaveCount(0);
  await visitor.close();
});
