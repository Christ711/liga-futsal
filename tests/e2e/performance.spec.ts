import { expect, test } from "@playwright/test";

import { createAccount, queryDatabase } from "./helpers/accounts";
import { seedLeague, seedMatch, seedMatchday, seedPlayer, seedTeam } from "./helpers/leagues";

/**
 * RNF-2: la tabla de posiciones de una liga pública se ve completa en menos de
 * 3 s con caché vacía, red "Slow 4G" (150 ms de latencia y 1,6 Mbps de bajada)
 * y CPU 4 veces más lenta.
 *
 * En CI mide contra el build local con una liga de 8 equipos. Para la medición
 * en producción (T86), `RNF2_URL` apunta a una liga pública real:
 *   RNF2_URL=https://liga-futsal-nine.vercel.app/ligas/<id> pnpm exec playwright test performance
 */
const LIMIT_MS = 3000;

async function leagueUrl(request: import("@playwright/test").APIRequestContext) {
  if (process.env.RNF2_URL) return process.env.RNF2_URL;
  const owner = await createAccount(request);
  const league = await seedLeague(owner.email);
  const teams = [];
  for (let index = 1; index <= 8; index++) {
    const team = await seedTeam(league.id, `Equipo número ${index} de la liga`.slice(0, 30));
    for (let player = 1; player <= 3; player++) {
      await seedPlayer(league.id, team.id, `Jugador ${player} del equipo ${index}`);
    }
    teams.push(team);
  }
  const matchday = await seedMatchday(league.id, "2026-09-05");
  let position = 1;
  for (let a = 0; a < teams.length; a++) {
    for (let b = a + 1; b < teams.length; b++) {
      const match = await seedMatch(
        matchday.id,
        { teamAId: teams[a]!.id, teamBId: teams[b]!.id },
        { position: position++, finished: true },
      );
      await queryDatabase(`INSERT INTO goal (id, "matchId", "teamId") VALUES ($1, $2, $3)`, [
        crypto.randomUUID(),
        match.id,
        teams[a]!.id,
      ]);
    }
  }
  return `/ligas/${league.id}`;
}

test("la tabla pública se ve en menos de 3 s con red Slow 4G, CPU 4x y caché vacía (RNF-2)", async ({
  browser,
  request,
}) => {
  const url = await leagueUrl(request);
  // Contexto nuevo: sin caché ni cookies, como la primera visita de un alumno.
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const start = Date.now();
  await page.goto(url, { waitUntil: "commit" });
  const table = page.getByRole("table", { name: "Tabla de posiciones" });
  await expect(table.getByRole("row").last()).toBeVisible({ timeout: 10_000 });
  // "Se ve completa" exige los estilos: sin CSS la tabla existe pero no se ve como tabla.
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every(
      (link) => link.sheet !== null,
    ),
  );
  const elapsed = Date.now() - start;

  test.info().annotations.push({ type: "RNF-2", description: `${url}: ${elapsed} ms` });
  console.log(`RNF-2 ${url}: tabla visible en ${elapsed} ms`);
  expect(elapsed).toBeLessThan(LIMIT_MS);
  await context.close();
});
