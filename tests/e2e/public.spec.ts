import { expect, test, type Page } from "@playwright/test";

import { createAccount, queryDatabase, signIn } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

const semesterHeadings = (page: Page, region: string) =>
  page.getByRole("region", { name: region, exact: true }).getByRole("heading", { level: 3 });

test("la portada agrupa las ligas en curso y el historial por semestre, del más reciente al más antiguo (RF-80)", async ({
  page,
  request,
}) => {
  const owner = await createAccount(request);
  const older = await seedLeague(owner.email, { semester: "2001-1" });
  const newer = await seedLeague(owner.email, { semester: "2001-2" });
  const oldFinal = await seedLeague(owner.email, { semester: "2000-1", status: "FINALIZED" });
  const newFinal = await seedLeague(owner.email, { semester: "2000-2", status: "FINALIZED" });

  await page.goto("/");

  const inProgress = await semesterHeadings(page, "Ligas en curso").allTextContents();
  expect(inProgress.indexOf("Semestre 2001-2")).toBeLessThan(inProgress.indexOf("Semestre 2001-1"));
  expect(inProgress.indexOf("Semestre 2001-1")).toBeGreaterThanOrEqual(0);
  const history = await semesterHeadings(page, "Historial").allTextContents();
  expect(history.indexOf("Semestre 2000-2")).toBeLessThan(history.indexOf("Semestre 2000-1"));
  const ongoing = page.getByRole("region", { name: "Ligas en curso", exact: true });
  await expect(ongoing.getByRole("link", { name: newer.name })).toHaveAttribute(
    "href",
    `/ligas/${newer.id}`,
  );
  await expect(ongoing.getByRole("link", { name: older.name })).toBeVisible();
  const finished = page.getByRole("region", { name: "Historial", exact: true });
  await expect(finished.getByRole("link", { name: newFinal.name })).toBeVisible();
  await expect(finished.getByRole("link", { name: oldFinal.name })).toBeVisible();
  await expect(ongoing.getByRole("link", { name: oldFinal.name })).toHaveCount(0);
});

test("sin sesión la portada no ofrece acciones de edición (RF-12)", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("textbox")).toHaveCount(0);
});

/** Liga en curso con una fecha: Tigres 2-1 Leones terminado, y Leones-Pumas pendiente. */
async function publicLeague(request: import("@playwright/test").APIRequestContext) {
  const owner = await createAccount(request);
  const league = await seedLeague(owner.email);
  const tigres = await seedTeam(league.id, "Tigres");
  const leones = await seedTeam(league.id, "Leones");
  const pumas = await seedTeam(league.id, "Pumas");
  const juan = await seedPlayer(league.id, tigres.id, "Juan");
  const matchday = await seedMatchday(league.id, "2026-09-05");
  const played = await seedMatch(
    matchday.id,
    { teamAId: tigres.id, teamBId: leones.id },
    { finished: true },
  );
  const pending = await seedMatch(
    matchday.id,
    { teamAId: leones.id, teamBId: pumas.id },
    { position: 2 },
  );
  for (const [teamId, scorerId] of [
    [tigres.id, juan.id],
    [tigres.id, juan.id],
    [leones.id, null],
  ] as const) {
    await queryDatabase(
      `INSERT INTO goal (id, "matchId", "teamId", "scorerId") VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), played.id, teamId, scorerId],
    );
  }
  await queryDatabase(
    `INSERT INTO point_deduction (id, "teamId", points, reason) VALUES ($1, $2, 1, 'Atraso')`,
    [crypto.randomUUID(), pumas.id],
  );
  return { owner, league, pending, leones };
}

const standingsRow = (page: Page, team: string) =>
  page
    .getByRole("table", { name: "Tabla de posiciones" })
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: team, exact: true }) });

test.describe("vista pública de una liga en curso (RF-81, RF-83)", () => {
  test("sin sesión muestra tabla, goleadores y fechas con número, día, estado y marcadores", async ({
    page,
    request,
  }) => {
    const { league } = await publicLeague(request);

    await page.goto(`/ligas/${league.id}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(league.name);
    await expect(standingsRow(page, "Tigres").getByRole("cell").last()).toHaveText("3");
    await expect(standingsRow(page, "Pumas").getByRole("cell").last()).toHaveText("-1*");
    await expect(page.getByRole("list", { name: "Descuentos de puntos" })).toContainText(
      "Pumas: 1 punto por Atraso",
    );
    const scorers = page.getByRole("table", { name: "Goleadores" });
    await expect(scorers.getByRole("row").nth(1)).toContainText("Juan");
    await expect(scorers.getByRole("row").nth(1).getByRole("cell").last()).toHaveText("2");
    const matchday = page.getByRole("group", { name: /Fecha 1/ });
    await expect(matchday).toContainText(/sábado 5 de septiembre de 2026/i);
    await expect(matchday).toContainText("Abierta");
    const played = matchday.getByRole("listitem", { name: "Tigres contra Leones" });
    await expect(played.getByLabel("Goles de Tigres")).toHaveText("2");
    await expect(played.getByLabel("Goles de Leones")).toHaveText("1");
    await expect(played).toContainText("Terminado");
    await expect(matchday.getByRole("listitem", { name: "Leones contra Pumas" })).toContainText(
      "Pendiente",
    );
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Administrar esta liga" })).toHaveCount(0);
  });

  test("al recargar muestra un partido recién terminado", async ({ page, request }) => {
    const { league, pending, leones } = await publicLeague(request);
    await page.goto(`/ligas/${league.id}`);
    await expect(standingsRow(page, "Leones").getByRole("cell").nth(2)).toHaveText("1");

    await queryDatabase(`INSERT INTO goal (id, "matchId", "teamId") VALUES ($1, $2, $3)`, [
      crypto.randomUUID(),
      pending.id,
      leones.id,
    ]);
    await queryDatabase(`UPDATE match SET status = 'FINISHED' WHERE id = $1`, [pending.id]);
    await page.reload();

    await expect(standingsRow(page, "Leones").getByRole("cell").nth(2)).toHaveText("2");
  });

  test("el HTML no contiene el correo del dueño (RF-14)", async ({ page, request }) => {
    const { owner, league } = await publicLeague(request);

    await page.goto(`/ligas/${league.id}`);

    expect(await page.content()).not.toContain(owner.email);
  });

  test("al dueño con sesión le ofrece administrar la liga", async ({ page, request }) => {
    const { owner, league } = await publicLeague(request);
    await signIn(page, owner.email, owner.password);
    await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();

    await page.goto(`/ligas/${league.id}`);
    await page.getByRole("link", { name: "Administrar esta liga" }).click();

    await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}$`));
  });

  test("una liga que no existe responde 404", async ({ page }) => {
    const response = await page.goto("/ligas/liga-inexistente");

    expect(response?.status()).toBe(404);
  });

  test("la portada y la liga pública caben en 360 px (RNF-3)", async ({ page, request }) => {
    const { league } = await publicLeague(request);
    const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

    await page.goto("/");
    expect(await scrollWidth()).toBeLessThanOrEqual(360);
    await page.goto(`/ligas/${league.id}`);
    expect(await scrollWidth()).toBeLessThanOrEqual(360);
  });
});
