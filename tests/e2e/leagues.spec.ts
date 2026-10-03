import { expect, test, type Page } from "@playwright/test";

import {
  createAccount,
  queryDatabase,
  signIn,
  signInNewAccount,
  signOut,
} from "./helpers/accounts";
import {
  currentSemester,
  previousSemester,
  seedLeague,
  seedTeamWithCrest,
  uniqueLeagueName,
} from "./helpers/leagues";

async function createLeague(page: Page, name: string, semester?: string) {
  await page.goto("/mis-ligas/nueva");
  await page.getByLabel("Nombre").fill(name);
  if (semester) await page.getByLabel("Semestre").fill(semester);
  await page.getByRole("button", { name: "Crear liga" }).click();
}

const leagueRow = async (id: string) =>
  (
    await queryDatabase<{ name: string; semester: string; status: string; ownerId: string }>(
      'SELECT name, semester, status, "ownerId" FROM league WHERE id = $1',
      [id],
    )
  )[0];

const leagueIdFromUrl = (page: Page) => page.url().split("/mis-ligas/")[1]!;

const details = (page: Page) => page.getByRole("region", { name: "Datos de la liga" });

async function editLeague(page: Page, values: { name?: string; semester?: string }) {
  if (values.name !== undefined) await details(page).getByLabel("Nombre").fill(values.name);
  if (values.semester !== undefined) {
    await details(page).getByLabel("Semestre").fill(values.semester);
  }
  await details(page).getByRole("button", { name: "Guardar cambios" }).click();
}

test.describe("crear una liga", () => {
  test("el formulario sugiere el semestre actual (RF-17)", async ({ page, request }) => {
    await signInNewAccount(page, request);

    await page.goto("/mis-ligas/nueva");

    await expect(page.getByLabel("Semestre")).toHaveValue(currentSemester());
  });

  test("crea la liga en curso, con el ayudante como dueño, y abre su administración (RF-15)", async ({
    page,
    request,
  }) => {
    const account = await signInNewAccount(page, request);
    const name = uniqueLeagueName();

    await page.goto("/mis-ligas");
    await page.getByRole("main").getByRole("link", { name: "Crear liga" }).click();
    await page.getByLabel("Nombre").fill(`  ${name}  `);
    await page.getByRole("button", { name: "Crear liga" }).click();

    await expect(page).toHaveURL(/\/mis-ligas\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.getByRole("main")).toContainText("En curso");
    const [owner] = await queryDatabase<{ id: string }>('SELECT id FROM "user" WHERE email = $1', [
      account.email,
    ]);
    expect(await leagueRow(leagueIdFromUrl(page))).toEqual({
      name,
      semester: currentSemester(),
      status: "IN_PROGRESS",
      ownerId: owner!.id,
    });
  });

  test("rechaza un nombre que ya usa otra liga del semestre, ignorando mayúsculas y espacios (RF-18)", async ({
    page,
    request,
  }) => {
    const other = await createAccount(request);
    const existing = await seedLeague(other.email);
    await signInNewAccount(page, request);

    await createLeague(page, `  ${existing.name.toUpperCase()} `);

    await expect(
      page.getByText(`Ya existe una liga con ese nombre en el semestre ${currentSemester()}.`),
    ).toBeVisible();
    await expect(page.getByLabel("Nombre")).toHaveValue(`  ${existing.name.toUpperCase()} `);
  });

  test("permite el mismo nombre en otro semestre", async ({ page, request }) => {
    const other = await createAccount(request);
    const existing = await seedLeague(other.email);
    await signInNewAccount(page, request);

    await createLeague(page, existing.name, previousSemester());

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(existing.name);
  });

  test("rechaza un nombre vacío o de 61 caracteres (RF-19)", async ({ page, request }) => {
    await signInNewAccount(page, request);

    await createLeague(page, "   ");
    await expect(page.getByText("Escribe un nombre.")).toBeVisible();

    await createLeague(page, "x".repeat(61));
    await expect(page.getByText("Usa como máximo 60 caracteres.")).toBeVisible();
  });

  test("rechaza un semestre con formato inválido (RF-16)", async ({ page, request }) => {
    await signInNewAccount(page, request);

    await createLeague(page, uniqueLeagueName(), "2026-3");

    await expect(
      page.getByText("Usa el formato AAAA-1 o AAAA-2, por ejemplo 2026-2."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/mis-ligas\/nueva$/);
  });
});

test.describe("administración de la liga", () => {
  test("el dueño ve la administración y otro ayudante es llevado a la vista pública (RF-93)", async ({
    page,
    request,
  }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    await page.goto(`/mis-ligas/${league.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(league.name);
    await expect(details(page)).toBeVisible();

    const other = await createAccount(request);
    await signOut(page);
    await signIn(page, other.email, other.password);
    await page.getByRole("button", { name: "Cerrar sesión" }).waitFor();
    await page.goto(`/mis-ligas/${league.id}`);

    await expect(page).toHaveURL(new RegExp(`/ligas/${league.id}$`));
  });

  test("una liga que no existe responde 404", async ({ page, request }) => {
    await signInNewAccount(page, request);

    const response = await page.goto("/mis-ligas/liga-inexistente");

    expect(response?.status()).toBe(404);
  });
});

test.describe("editar una liga", () => {
  test("el dueño cambia el nombre y el semestre (RF-20)", async ({ page, request }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    const newName = uniqueLeagueName();
    await page.goto(`/mis-ligas/${league.id}`);

    await editLeague(page, { name: newName, semester: previousSemester() });

    await expect(details(page).getByRole("status")).toHaveText("Cambios guardados.");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(newName);
    expect(await leagueRow(league.id)).toMatchObject({
      name: newName,
      semester: previousSemester(),
    });
  });

  test("rechaza un nombre que ya usa otra liga del mismo semestre (RF-18)", async ({
    page,
    request,
  }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    const taken = await seedLeague(owner.email);
    await page.goto(`/mis-ligas/${league.id}`);

    await editLeague(page, { name: taken.name.toLowerCase() });

    await expect(
      details(page).getByText(
        `Ya existe una liga con ese nombre en el semestre ${currentSemester()}.`,
      ),
    ).toBeVisible();
    expect(await leagueRow(league.id)).toMatchObject({ name: league.name });
  });

  test("conservar el mismo nombre con otras mayúsculas no choca consigo misma", async ({
    page,
    request,
  }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    await page.goto(`/mis-ligas/${league.id}`);

    await editLeague(page, { name: league.name.toUpperCase() });

    await expect(details(page).getByRole("status")).toHaveText("Cambios guardados.");
  });

  test("rechaza un semestre inválido sin cambiar nada (RF-16)", async ({ page, request }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    await page.goto(`/mis-ligas/${league.id}`);

    await editLeague(page, { semester: "26-2" });

    await expect(
      details(page).getByText("Usa el formato AAAA-1 o AAAA-2, por ejemplo 2026-2."),
    ).toBeVisible();
    expect(await leagueRow(league.id)).toMatchObject({ semester: currentSemester() });
  });

  test("una liga finalizada no ofrece editar sus datos (RF-76)", async ({ page, request }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email, { status: "FINALIZED" });

    await page.goto(`/mis-ligas/${league.id}`);

    await expect(page.getByRole("main")).toContainText("Finalizada");
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Eliminar liga" })).toBeVisible();
  });
});

test.describe("eliminar una liga", () => {
  test("el diálogo advierte el borrado total y cancelar no borra nada (RF-78)", async ({
    page,
    request,
  }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    await page.goto(`/mis-ligas/${league.id}`);

    await page.getByRole("button", { name: "Eliminar liga" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(
      "Se borrarán todos sus datos: equipos, escudos, jugadores, fechas, partidos, goles y descuentos.",
    );
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    expect(await leagueRow(league.id)).toBeDefined();
  });

  test("al confirmar borra la liga con sus equipos y escudos (RF-79)", async ({
    page,
    request,
  }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email);
    const team = await seedTeamWithCrest(league.id);
    await page.goto(`/mis-ligas/${league.id}`);

    await page.getByRole("button", { name: "Eliminar liga" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar liga" }).click();

    await expect(page).toHaveURL(/\/mis-ligas$/);
    await expect(page.getByText(league.name)).toHaveCount(0);
    expect(await leagueRow(league.id)).toBeUndefined();
    expect(await queryDatabase("SELECT 1 FROM team WHERE id = $1", [team.id])).toEqual([]);
    expect(await queryDatabase('SELECT 1 FROM team_crest WHERE "teamId" = $1', [team.id])).toEqual(
      [],
    );
  });

  test("también se puede eliminar una liga finalizada (RF-78)", async ({ page, request }) => {
    const owner = await signInNewAccount(page, request);
    const league = await seedLeague(owner.email, { status: "FINALIZED" });
    await page.goto(`/mis-ligas/${league.id}`);

    await page.getByRole("button", { name: "Eliminar liga" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar liga" }).click();

    await expect(page).toHaveURL(/\/mis-ligas$/);
    expect(await leagueRow(league.id)).toBeUndefined();
  });
});

test("las páginas de nueva liga y de administración caben en 360 px (RNF-3)", async ({
  page,
  request,
}) => {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email, {
    name: `Liga de futsal de la sección 12 del curso ${crypto.randomUUID().slice(0, 8)}`,
  });
  const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

  await page.goto("/mis-ligas/nueva");
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
  await page.goto(`/mis-ligas/${league.id}`);
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
  await page.getByRole("button", { name: "Eliminar liga" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  expect(await scrollWidth()).toBeLessThanOrEqual(360);
});
