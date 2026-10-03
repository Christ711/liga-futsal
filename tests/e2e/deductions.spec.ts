import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedTeam } from "./helpers/leagues";

const section = (page: Page) => page.getByRole("region", { name: "Descuentos de puntos" });

const newDeduction = (page: Page) => section(page).getByRole("form", { name: "Nuevo descuento" });

const deductionItem = (page: Page, reason: string) =>
  section(page).getByRole("listitem").filter({ hasText: reason });

async function applyDeduction(page: Page, team: string, points: string, reason: string) {
  const form = newDeduction(page);
  await form.getByLabel("Equipo").selectOption({ label: team });
  await form.getByLabel("Puntos").fill(points);
  await form.getByLabel("Motivo").fill(reason);
  await form.getByRole("button", { name: "Aplicar descuento" }).click();
}

async function openLeague(page: Page, request: APIRequestContext) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const tigres = await seedTeam(league.id, "Tigres");
  await seedTeam(league.id, "Leones");
  await page.goto(`/mis-ligas/${league.id}`);
  return { league, tigres };
}

const deductionsOf = (teamId: string) =>
  queryDatabase<{ points: number; reason: string }>(
    'SELECT points, reason FROM point_deduction WHERE "teamId" = $1 ORDER BY reason',
    [teamId],
  );

test("aplica dos descuentos al mismo equipo, edita uno y elimina el otro (RF-67 a RF-69)", async ({
  page,
  request,
}) => {
  const { tigres } = await openLeague(page, request);

  await applyDeduction(page, "Tigres", "3", "Tarjetas rojas");
  await expect(deductionItem(page, "Tarjetas rojas")).toContainText("Tigres");
  await applyDeduction(page, "Tigres", "2", "Atraso");
  await expect(deductionItem(page, "Atraso")).toContainText("2 puntos");
  await expect(newDeduction(page).getByLabel("Motivo")).toHaveValue("");

  const edited = deductionItem(page, "Tarjetas rojas");
  await edited.locator("summary").click();
  await edited.getByLabel("Puntos").fill("5");
  await edited.getByLabel("Motivo").fill("Tarjetas rojas en la fecha 2");
  await edited.getByRole("button", { name: "Guardar descuento" }).click();
  await expect(deductionItem(page, "Tarjetas rojas en la fecha 2")).toContainText("5 puntos");

  const removed = deductionItem(page, "Atraso");
  await removed.locator("summary").click();
  await removed.getByRole("button", { name: "Eliminar descuento" }).click();
  await expect(deductionItem(page, "Atraso")).toHaveCount(0);

  expect(await deductionsOf(tigres.id)).toEqual([
    { points: 5, reason: "Tarjetas rojas en la fecha 2" },
  ]);
});

test("rechaza 0 puntos, un motivo vacío y uno de 101 caracteres (RF-67)", async ({
  page,
  request,
}) => {
  const { tigres } = await openLeague(page, request);

  await applyDeduction(page, "Tigres", "0", "Atraso");
  await expect(newDeduction(page).getByText("Usa un número entero entre 1 y 999.")).toBeVisible();
  await applyDeduction(page, "Tigres", "2", "   ");
  await expect(newDeduction(page).getByText("Escribe un motivo.")).toBeVisible();
  await applyDeduction(page, "Tigres", "2", "x".repeat(101));
  await expect(newDeduction(page).getByText("Usa como máximo 100 caracteres.")).toBeVisible();

  expect(await deductionsOf(tigres.id)).toEqual([]);
});

test("sin equipos no ofrece aplicar descuentos", async ({ page, request }) => {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);

  await page.goto(`/mis-ligas/${league.id}`);

  await expect(section(page)).toContainText("Agrega equipos para poder aplicar descuentos.");
  await expect(section(page).getByRole("button", { name: "Aplicar descuento" })).toHaveCount(0);
});

test("en una liga finalizada los descuentos se ven pero no se cambian (RF-76)", async ({
  page,
  request,
}) => {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email, { status: "FINALIZED" });
  const team = await seedTeam(league.id, "Tigres");
  await queryDatabase(
    `INSERT INTO point_deduction (id, "teamId", points, reason) VALUES ($1, $2, 3, 'Atraso')`,
    [crypto.randomUUID(), team.id],
  );

  await page.goto(`/mis-ligas/${league.id}`);

  await expect(deductionItem(page, "Atraso")).toContainText("3 puntos");
  await expect(section(page).locator("summary")).toHaveCount(0);
  await expect(section(page).getByRole("button", { name: "Aplicar descuento" })).toHaveCount(0);
});
