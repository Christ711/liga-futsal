import { expect, test } from "@playwright/test";

import { createAccount, signIn, signInNewAccount } from "./helpers/accounts";
import { previousSemester, seedLeague } from "./helpers/leagues";

test("sin sesión, las rutas de administración redirigen a ingresar", async ({ page }) => {
  for (const path of ["/mis-ligas", "/mis-ligas/nueva", "/mis-ligas/cualquier-liga", "/cuenta"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/ingresar$/);
  }
});

test("al ingresar llega a sus ligas, y la cabecera ofrece Mis ligas, Cuenta y Cerrar sesión", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);

  await signIn(page, account.email, account.password);

  await expect(page).toHaveURL(/\/mis-ligas$/);
  const header = page.getByRole("banner");
  await expect(header.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await header.getByRole("link", { name: "Cuenta" }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
  await header.getByRole("link", { name: "Mis ligas" }).click();
  await expect(page).toHaveURL(/\/mis-ligas$/);
});

test("sin sesión, la cabecera no ofrece las rutas de administración (RF-12)", async ({ page }) => {
  await page.goto("/");

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Mis ligas" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Cuenta" })).toHaveCount(0);
});

test("muestra sus ligas separadas en curso y finalizadas, y no las de otros (RF-21, RF-22)", async ({
  page,
  request,
}) => {
  const account = await signInNewAccount(page, request);
  const current = await seedLeague(account.email);
  const previous = await seedLeague(account.email, { semester: previousSemester() });
  const finalized = await seedLeague(account.email, { status: "FINALIZED" });
  const other = await createAccount(request);
  const othersLeague = await seedLeague(other.email);

  await page.goto("/mis-ligas");

  const inProgress = page.getByRole("region", { name: "En curso" });
  const done = page.getByRole("region", { name: "Finalizadas" });
  await expect(inProgress.getByRole("link", { name: current.name })).toBeVisible();
  await expect(inProgress.getByRole("link", { name: previous.name })).toBeVisible();
  await expect(done.getByRole("link", { name: finalized.name })).toBeVisible();
  await expect(inProgress.getByRole("link", { name: finalized.name })).toHaveCount(0);
  await expect(page.getByText(othersLeague.name)).toHaveCount(0);
  await inProgress.getByRole("link", { name: current.name }).click();
  await expect(page).toHaveURL(new RegExp(`/mis-ligas/${current.id}$`));
});

test("una liga en curso de un semestre terminado muestra el aviso con acceso a finalizarla (RF-94)", async ({
  page,
  request,
}) => {
  const account = await signInNewAccount(page, request);
  const current = await seedLeague(account.email);
  const previous = await seedLeague(account.email, { semester: previousSemester() });

  await page.goto("/mis-ligas");

  const previousItem = page.getByRole("listitem").filter({ hasText: previous.name });
  const currentItem = page.getByRole("listitem").filter({ hasText: current.name });
  await expect(previousItem).toContainText("El semestre terminó");
  await expect(previousItem.getByRole("link", { name: "Finalizar liga" })).toHaveAttribute(
    "href",
    `/mis-ligas/${previous.id}#finalizar-liga`,
  );
  await expect(currentItem).not.toContainText("El semestre terminó");
});

test("sin ligas, invita a crear la primera", async ({ page, request }) => {
  await signInNewAccount(page, request);

  await page.goto("/mis-ligas");

  await expect(page.getByText("Todavía no tienes ligas.")).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Crear liga" }).click();
  await expect(page).toHaveURL(/\/mis-ligas\/nueva$/);
});

test("la lista de ligas cabe en 360 px sin desplazamiento horizontal (RNF-3)", async ({
  page,
  request,
}) => {
  const account = await signInNewAccount(page, request);
  await seedLeague(account.email, {
    name: "Liga de futsal de la sección 12 del curso de los martes",
    semester: previousSemester(),
  });

  await page.goto("/mis-ligas");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
