import { expect, test } from "@playwright/test";

import { createAccount, queryDatabase, signInAsAdmin, signInNewAccount } from "./helpers/accounts";
import { e2eAdminEmail } from "../../playwright.config";
import { seedLeague, seedPlayer, seedTeam } from "./helpers/leagues";

const NOTICE = "Estás editando la liga de otro ayudante";

test("el administrador ve las ligas de otros ayudantes sin datos de sus dueños (RF-110)", async ({
  page,
  request,
}) => {
  const owner = await createAccount(request);
  const inProgress = await seedLeague(owner.email);
  const finalized = await seedLeague(owner.email, { status: "FINALIZED" });

  await signInAsAdmin(page, request);
  await page.goto("/mis-ligas");

  const others = page.getByRole("region", { name: "Otras ligas en curso", exact: true });
  await expect(others.getByRole("link", { name: inProgress.name })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Otras ligas finalizadas", exact: true })
      .getByRole("link", { name: finalized.name }),
  ).toBeVisible();
  await expect(page.getByText(owner.email)).toHaveCount(0);
});

test("el administrador carga una fecha y un gol en la liga de otro ayudante (RF-109, RF-111)", async ({
  page,
  request,
}) => {
  const owner = await createAccount(request);
  const league = await seedLeague(owner.email);
  const tigres = await seedTeam(league.id, "Tigres");
  await seedTeam(league.id, "Leones");
  await seedTeam(league.id, "Pumas");
  await seedPlayer(league.id, tigres.id, "Juan");
  await signInAsAdmin(page, request);

  await page.goto("/mis-ligas");
  await page
    .getByRole("region", { name: "Otras ligas en curso", exact: true })
    .getByRole("link", { name: league.name })
    .click();

  await expect(page).toHaveURL(new RegExp(`/mis-ligas/${league.id}$`));
  await expect(page.getByRole("status").filter({ hasText: NOTICE })).toBeVisible();
  const matchdays = page.getByRole("region", { name: "Fechas" });
  await matchdays.getByRole("button", { name: "Generar fecha" }).click();
  const dialog = page.getByRole("dialog", { name: "Generar fecha" });
  await dialog.getByLabel("Día de juego").fill("2026-08-15");
  await dialog.getByRole("button", { name: "Generar fecha" }).click();
  await expect(dialog).toBeHidden();
  await matchdays.getByRole("link", { name: /Fecha 1/ }).click();
  await expect(page.getByRole("status").filter({ hasText: NOTICE })).toBeVisible();

  const card = page
    .getByRole("listitem", { name: /^Partido \d+:/ })
    .filter({ hasText: "Tigres" })
    .first();
  await card.getByRole("button", { name: "Agregar gol" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Juan", exact: true }).click();
  await expect(card.getByLabel("Goles de Tigres")).toHaveText("1");
  await expect
    .poll(
      async () =>
        (
          await queryDatabase<{ count: string }>(
            `SELECT count(*) FROM goal g JOIN match m ON m.id = g."matchId"
           JOIN matchday d ON d.id = m."matchdayId" WHERE d."leagueId" = $1`,
            [league.id],
          )
        )[0]!.count,
    )
    .toBe("1");
  const [row] = await queryDatabase<{ ownerEmail: string }>(
    `SELECT u.email AS "ownerEmail" FROM league l JOIN "user" u ON u.id = l."ownerId" WHERE l.id = $1`,
    [league.id],
  );
  // La liga sigue siendo de su dueño: el administrador no se la apropia.
  expect(row!.ownerEmail).toBe(owner.email);
});

test("en sus propias ligas el administrador no ve el aviso", async ({ page, request }) => {
  await signInAsAdmin(page, request);
  const league = await seedLeague(e2eAdminEmail);

  await page.goto(`/mis-ligas/${league.id}`);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(league.name);
  await expect(page.getByText(NOTICE)).toHaveCount(0);
});

test("un ayudante que no es administrador sigue yendo a la vista pública (RF-93)", async ({
  page,
  request,
}) => {
  const owner = await createAccount(request);
  const league = await seedLeague(owner.email);
  await signInNewAccount(page, request);

  await page.goto(`/mis-ligas/${league.id}`);

  await expect(page).toHaveURL(new RegExp(`/ligas/${league.id}$`));
});
