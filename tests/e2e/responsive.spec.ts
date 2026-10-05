import { expect, test, type Page } from "@playwright/test";

import { createAccount, queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

/** Nombres al máximo permitido, el peor caso para el ancho (RF-19, RF-27, RF-36). */
const LONG_TEAM = (index: number) => `Club Deportivo Universitario ${index}`.padEnd(30, "x");
const LONG_PLAYER = (index: number) => `Bartolomé Fernández Riquelme ${index}`.padEnd(40, "x");

async function widthOf(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  return page.evaluate(() => document.documentElement.scrollWidth);
}

/** Liga en curso de 8 equipos con nombres largos, una fecha jugada y un descuento. */
async function fullLeague(ownerEmail: string) {
  const league = await seedLeague(ownerEmail, {
    name: `Liga de futsal de la sección 12 del curso ${crypto.randomUUID().slice(0, 8)}`,
  });
  const teams = [];
  for (let index = 1; index <= 8; index++) {
    const team = await seedTeam(league.id, LONG_TEAM(index));
    await seedPlayer(league.id, team.id, LONG_PLAYER(index));
    teams.push(team);
  }
  const matchday = await seedMatchday(league.id, "2026-09-05");
  await seedMatch(
    matchday.id,
    { teamAId: teams[0]!.id, teamBId: teams[1]!.id },
    { finished: true },
  );
  await seedMatch(matchday.id, { teamAId: teams[2]!.id, teamBId: teams[3]!.id }, { position: 2 });
  await queryDatabase(
    `INSERT INTO point_deduction (id, "teamId", points, reason) VALUES ($1, $2, 2, $3)`,
    [crypto.randomUUID(), teams[0]!.id, "Inasistencia a la fecha 2 sin aviso previo al ayudante"],
  );
  return { league, matchday };
}

test("las páginas públicas y de cuenta caben en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
  request,
}) => {
  const owner = await createAccount(request);
  const { league } = await fullLeague(owner.email);
  const finalized = await seedLeague(owner.email, { status: "FINALIZED" });
  await seedTeam(finalized.id, LONG_TEAM(1));
  await queryDatabase(
    `INSERT INTO league_snapshot ("leagueId", standings, "topScorers") VALUES ($1, '[]', '[]')`,
    [finalized.id],
  );

  for (const path of [
    "/",
    `/ligas/${league.id}`,
    `/ligas/${finalized.id}`,
    "/ingresar",
    "/registro",
    "/recuperar",
    "/restablecer?token=cualquiera",
  ]) {
    expect(await widthOf(page, path), path).toBeLessThanOrEqual(360);
  }
});

test("las páginas autenticadas caben en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
  request,
}) => {
  const owner = await signInNewAccount(page, request);
  const { league, matchday } = await fullLeague(owner.email);

  for (const path of [
    "/mis-ligas",
    "/mis-ligas/nueva",
    `/mis-ligas/${league.id}`,
    `/mis-ligas/${league.id}/fechas/${matchday.id}`,
    "/cuenta",
  ]) {
    expect(await widthOf(page, path), path).toBeLessThanOrEqual(360);
  }

  // Con todo desplegado: un equipo y un jugador en edición, y las pestañas de la fecha.
  await page.goto(`/mis-ligas/${league.id}`);
  const team = page
    .getByRole("region", { name: "Equipos" })
    .getByRole("listitem", { name: LONG_TEAM(1), exact: true });
  await team.locator("summary").first().click();
  await team
    .getByRole("listitem", { name: LONG_PLAYER(1), exact: true })
    .locator("summary")
    .click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.goto(`/mis-ligas/${league.id}/fechas/${matchday.id}`);
  for (const tab of ["Tabla", "Goleadores"]) {
    await page.getByRole("tab", { name: tab }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      tab,
    ).toBeLessThanOrEqual(360);
  }
});
