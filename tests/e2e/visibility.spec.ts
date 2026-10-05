import { expect, test, type Page } from "@playwright/test";

import { createAccount, queryDatabase, signIn } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;

/** Una liga en curso con una fecha y una finalizada con su snapshot, del mismo dueño. */
async function leagues(request: import("@playwright/test").APIRequestContext) {
  const owner = await createAccount(request);
  const inProgress = await seedLeague(owner.email);
  const tigres = await seedTeam(inProgress.id, "Tigres");
  const leones = await seedTeam(inProgress.id, "Leones");
  await seedPlayer(inProgress.id, tigres.id, "Juan");
  const matchday = await seedMatchday(inProgress.id, "2026-09-05");
  await seedMatch(matchday.id, { teamAId: tigres.id, teamBId: leones.id }, { finished: true });
  const finalized = await seedLeague(owner.email, { status: "FINALIZED" });
  await seedTeam(finalized.id, "Pumas");
  await queryDatabase(
    `INSERT INTO league_snapshot ("leagueId", standings, "topScorers") VALUES ($1, '[]', '[]')`,
    [finalized.id],
  );
  return { owner, inProgress, finalized, matchday };
}

const publicPaths = (data: Awaited<ReturnType<typeof leagues>>) => [
  "/",
  `/ligas/${data.inProgress.id}`,
  `/ligas/${data.finalized.id}`,
];

async function expectNoActions(page: Page) {
  const main = page.getByRole("main");
  await expect(main.getByRole("button")).toHaveCount(0);
  await expect(main.getByRole("textbox")).toHaveCount(0);
  await expect(main.locator("form")).toHaveCount(0);
  // La cabecera con sesión enlaza a "Mis ligas": eso es navegación, no una acción sobre la liga.
  await expect(main.locator('a[href^="/mis-ligas"]')).toHaveCount(0);
}

test("sin sesión ninguna página pública ofrece acciones de creación, edición ni eliminación (RF-12)", async ({
  page,
  request,
}) => {
  const data = await leagues(request);

  for (const path of publicPaths(data)) {
    await page.goto(path);
    await expectNoActions(page);
  }
});

test("ninguna página pública contiene correos, ni sin sesión ni con sesión (RF-14)", async ({
  page,
  request,
}) => {
  const data = await leagues(request);

  for (const path of publicPaths(data)) {
    await page.goto(path);
    expect(await page.content(), path).not.toMatch(EMAIL);
  }
  const visitor = await createAccount(request);
  await signIn(page, visitor.email, visitor.password);
  await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();
  for (const path of publicPaths(data)) {
    await page.goto(path);
    expect(await page.content(), path).not.toContain(data.owner.email);
  }
});

test("un ayudante ajeno solo ve la vista pública y las rutas privadas le responden 403 (RF-13, RF-93)", async ({
  page,
  request,
}) => {
  const data = await leagues(request);
  const stranger = await createAccount(request);
  await signIn(page, stranger.email, stranger.password);
  await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();

  for (const path of [
    `/mis-ligas/${data.inProgress.id}`,
    `/mis-ligas/${data.inProgress.id}/fechas/${data.matchday.id}`,
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/ligas/${data.inProgress.id}$`));
    await expectNoActions(page);
  }
  for (const path of [
    `/api/leagues/${data.inProgress.id}/matchdays/${data.matchday.id}`,
    `/api/leagues/${data.inProgress.id}/tables`,
  ]) {
    expect((await page.request.get(path)).status(), path).toBe(403);
  }
});
