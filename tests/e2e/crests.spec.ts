import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

import { noisePng } from "../support/crest-images";
import { queryDatabase, signInNewAccount } from "./helpers/accounts";
import { seedLeague, seedTeam } from "./helpers/leagues";

const REJECTION = "El escudo debe ser una imagen PNG, JPG o WebP de hasta 2 MB.";

const fixture = (name: string) => readFileSync(`tests/fixtures/crests/${name}`);

const teamItem = (page: Page, name: string) =>
  page.getByRole("region", { name: "Equipos" }).getByRole("listitem").filter({ hasText: name });

/** Liga con el equipo "Los Tigres" y su editor abierto. */
async function openTeamEditor(page: Page, request: import("@playwright/test").APIRequestContext) {
  const owner = await signInNewAccount(page, request);
  const league = await seedLeague(owner.email);
  const team = await seedTeam(league.id, "Los Tigres");
  await page.goto(`/mis-ligas/${league.id}`);
  const item = teamItem(page, "Los Tigres");
  await item.locator("summary").click();
  return { item, team };
}

async function uploadCrest(
  item: ReturnType<typeof teamItem>,
  file: { name: string; mimeType: string; buffer: Buffer },
  button: "Subir escudo" | "Reemplazar escudo" = "Subir escudo",
) {
  await item.getByLabel("Escudo", { exact: true }).setInputFiles(file);
  await item.getByRole("button", { name: button }).click();
}

const crestImage = (item: ReturnType<typeof teamItem>) =>
  item.getByRole("img", { name: "Escudo de Los Tigres" }).first();

const crestRows = (teamId: string) =>
  queryDatabase('SELECT hash FROM team_crest WHERE "teamId" = $1', [teamId]);

test("sube un escudo de 1,9 MB y se sirve reducido, como WebP y con caché permanente (RF-28, RF-30)", async ({
  page,
  request,
}) => {
  const { item, team } = await openTeamEditor(page, request);
  const image = await noisePng(800, 830);
  expect(image.length).toBeGreaterThan(1.9 * 1024 * 1024);

  await uploadCrest(item, { name: "escudo.png", mimeType: "image/png", buffer: image });

  await expect(crestImage(item)).toBeVisible();
  await expect(item.getByText("Ningún archivo elegido")).toBeVisible();
  const src = await crestImage(item).getAttribute("src");
  expect(src).toMatch(new RegExp(`^/escudos/${team.id}/[0-9a-f]{16}$`));
  const response = await request.get(src!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/webp");
  expect(response.headers()["cache-control"]).toContain("max-age=31536000");
  expect(response.headers()["cache-control"]).toContain("immutable");
  const metadata = await sharp(await response.body()).metadata();
  expect([metadata.width, metadata.height]).toEqual([247, 256]);
});

test("reemplazar el escudo cambia su URL y la anterior deja de existir (RF-32)", async ({
  page,
  request,
}) => {
  const { item } = await openTeamEditor(page, request);
  await uploadCrest(item, {
    name: "escudo.png",
    mimeType: "image/png",
    buffer: fixture("escudo-600x300.png"),
  });
  await expect(crestImage(item)).toBeVisible();
  const first = await crestImage(item).getAttribute("src");

  await uploadCrest(
    item,
    { name: "otro.jpg", mimeType: "image/jpeg", buffer: fixture("escudo-300x300.jpg") },
    "Reemplazar escudo",
  );

  await expect(crestImage(item)).not.toHaveAttribute("src", first!);
  expect((await request.get(first!)).status()).toBe(404);
});

test("quitar el escudo vuelve al genérico con la inicial (RF-31, RF-32)", async ({
  page,
  request,
}) => {
  const { item, team } = await openTeamEditor(page, request);
  await uploadCrest(item, {
    name: "escudo.webp",
    mimeType: "image/webp",
    buffer: fixture("escudo-200x400.webp"),
  });
  await expect(crestImage(item)).toBeVisible();

  await item.getByRole("button", { name: "Quitar escudo" }).click();

  await expect(item.getByRole("img", { name: "Escudo genérico de Los Tigres" }).first()).toHaveText(
    "L",
  );
  await expect(item.getByRole("img", { name: "Escudo de Los Tigres" })).toHaveCount(0);
  expect(await crestRows(team.id)).toEqual([]);
});

test.describe("rechaza archivos que no son escudos válidos (RF-29)", () => {
  for (const [label, file] of [
    ["un SVG", { name: "escudo.svg", mimeType: "image/svg+xml", buffer: fixture("escudo.svg") }],
    [
      "un texto renombrado a .png",
      { name: "escudo.png", mimeType: "image/png", buffer: fixture("texto-renombrado.png") },
    ],
  ] as const) {
    test(`rechaza ${label} indicando formatos y tamaño`, async ({ page, request }) => {
      const { item, team } = await openTeamEditor(page, request);

      await uploadCrest(item, { ...file, buffer: Buffer.from(file.buffer) });

      await expect(item.getByText(REJECTION)).toBeVisible();
      expect(await crestRows(team.id)).toEqual([]);
    });
  }

  test("rechaza un archivo de más de 2 MB sin enviarlo", async ({ page, request }) => {
    const { item, team } = await openTeamEditor(page, request);
    const image = await noisePng(900, 900);
    expect(image.length).toBeGreaterThan(2 * 1024 * 1024);

    await uploadCrest(item, { name: "grande.png", mimeType: "image/png", buffer: image });

    await expect(item.getByText(REJECTION)).toBeVisible();
    expect(await crestRows(team.id)).toEqual([]);
  });
});

test("una URL de escudo con un hash que no corresponde responde 404", async ({ request }) => {
  const response = await request.get("/escudos/equipo-inexistente/0123456789abcdef");

  expect(response.status()).toBe(404);
});
