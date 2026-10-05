import { expect, test } from "@playwright/test";

import { e2eInviteCode } from "../../playwright.config";
import { PASSWORD, uniqueEmail } from "./helpers/accounts";
import { uniqueLeagueName } from "./helpers/leagues";

/**
 * Flujo principal de los criterios de finalización de la spec 001, todo por la
 * interfaz y a 360 px: registro con código, liga, 4 equipos con jugadores,
 * fecha, goles, partido terminado, tabla pública sin sesión y fecha finalizada.
 */
test("un ayudante nuevo lleva una fecha completa desde el registro hasta la tabla pública", async ({
  page,
  browser,
}) => {
  expect(page.viewportSize()?.width).toBe(360);

  // Registro con el código de invitación (RF-1).
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(uniqueEmail());
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByLabel("Código de invitación").fill(e2eInviteCode);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/mis-ligas$/);

  // Nueva liga (RF-15).
  const leagueName = uniqueLeagueName();
  await page.getByRole("main").getByRole("link", { name: "Crear liga" }).click();
  await page.getByLabel("Nombre").fill(leagueName);
  await page.getByRole("button", { name: "Crear liga" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(leagueName);
  const leagueUrl = page.url();

  // Cuatro equipos con un jugador cada uno (RF-23, RF-33).
  const teams = page.getByRole("region", { name: "Equipos" });
  const roster = { Tigres: "Juan", Leones: "Pedro", Pumas: "Diego", Halcones: "Tomás" };
  for (const [team, player] of Object.entries(roster)) {
    await teams.getByLabel("Nuevo equipo").fill(team);
    await teams.getByRole("button", { name: "Agregar equipo" }).click();
    const item = teams.getByRole("listitem", { name: team, exact: true });
    await item.locator("summary").first().click();
    const players = item.getByRole("region", { name: "Jugadores" });
    await players.getByLabel("Nuevo jugador").fill(player);
    await players.getByRole("button", { name: "Agregar jugador" }).click();
    await expect(players.getByRole("listitem", { name: player, exact: true })).toBeVisible();
    await item.locator("summary").first().click();
  }

  // Generar la fecha: todos contra todos, 6 partidos (RF-42, RF-97).
  const matchdays = page.getByRole("region", { name: "Fechas" });
  await matchdays.getByRole("button", { name: "Generar fecha" }).click();
  const generate = page.getByRole("dialog", { name: "Generar fecha" });
  await generate.getByRole("button", { name: "Generar fecha" }).click();
  await expect(generate).toBeHidden();
  await matchdays.getByRole("link", { name: /Fecha 1/ }).click();
  await expect(page.getByRole("listitem", { name: /^Partido \d+:/ })).toHaveCount(6);

  // Dos goles en el primer partido, cada uno en 2 toques (RF-53, RNF-1), y terminarlo (RF-58).
  const first = page.getByRole("listitem", { name: /^Partido 1:/ });
  const title = (await first.getAttribute("aria-label"))!;
  const [teamA, teamB] = title.replace(/^Partido 1: /, "").split(" contra ") as [
    keyof typeof roster,
    keyof typeof roster,
  ];
  for (const scorer of [roster[teamA], roster[teamA]]) {
    await first.getByRole("button", { name: "Agregar gol" }).click();
    await page.getByRole("dialog").getByRole("button", { name: scorer, exact: true }).click();
  }
  await expect(first.getByLabel(`Goles de ${teamA}`)).toHaveText("2");
  await expect(first.getByLabel(`Goles de ${teamB}`)).toHaveText("0");
  await first.getByRole("button", { name: "Terminar partido" }).click();
  await expect(first).toContainText("Terminado");
  await page.waitForLoadState("networkidle");

  // La tabla pública, sin sesión, ya refleja el partido (RF-81, RF-83).
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto("/");
  await publicPage
    .getByRole("region", { name: "Ligas en curso", exact: true })
    .getByRole("link", { name: leagueName })
    .click();
  const leader = publicPage
    .getByRole("table", { name: "Tabla de posiciones" })
    .getByRole("row")
    .nth(1);
  await expect(leader).toContainText(teamA);
  await expect(leader.getByRole("cell").last()).toHaveText("3");
  await expect(
    publicPage.getByRole("table", { name: "Goleadores" }).getByRole("row").nth(1),
  ).toContainText(roster[teamA]);
  await visitor.close();

  // Finalizar la fecha con los 5 pendientes (RF-101, RF-104).
  await page.getByRole("button", { name: "Finalizar fecha" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Quedarán 5 partidos pendientes");
  await page.getByRole("alertdialog").getByRole("button", { name: "Finalizar fecha" }).click();
  await page
    .getByRole("dialog", { name: "¿Era la última fecha del semestre?" })
    .getByRole("button", { name: "No, seguir" })
    .click();
  await expect(page.getByRole("main")).toContainText("Incompleta (5)");
  await expect(first).toContainText("Bloqueado");

  await page.goto(leagueUrl);
  await expect(matchdays.getByRole("listitem", { name: "Fecha 1" })).toContainText(
    "Incompleta (5)",
  );
});
