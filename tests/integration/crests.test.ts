import { readFileSync } from "node:fs";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { MAX_CREST_BYTES, processCrest } from "@/server/crests/process";

import { noisePng, solidImage } from "../support/crest-images";

const fixture = (name: string) => readFileSync(`tests/fixtures/crests/${name}`);

const REJECTION = {
  ok: false,
  error: expect.objectContaining({
    code: "CREST_INVALID",
    message: "El escudo debe ser una imagen PNG, JPG o WebP de hasta 2 MB.",
  }),
};

async function processed(input: Buffer) {
  const result = await processCrest(input);
  if (!result.ok) throw new Error(`Se rechazó un escudo válido: ${result.error.code}`);
  const metadata = await sharp(result.data.data).metadata();
  return { ...result.data, metadata };
}

describe("processCrest (RF-28, RF-29, RF-30)", () => {
  it.each([
    ["PNG", "escudo-600x300.png", 256, 128],
    ["JPG", "escudo-300x300.jpg", 256, 256],
    ["WebP", "escudo-200x400.webp", 128, 256],
  ])(
    "un %s válido sale como WebP de máximo 256 px conservando la proporción",
    async (_format, file, width, height) => {
      const { metadata } = await processed(fixture(file));

      expect(metadata.format).toBe("webp");
      expect([metadata.width, metadata.height]).toEqual([width, height]);
    },
  );

  it("no agranda un escudo más chico que 256 px", async () => {
    const { metadata } = await processed(fixture("escudo-100x50.png"));

    expect([metadata.width, metadata.height]).toEqual([100, 50]);
  });

  it("descarta los metadatos del archivo original", async () => {
    const withExif = await sharp(fixture("escudo-300x300.jpg"))
      .withExif({ IFD0: { Copyright: "Dato que no se debe guardar" } })
      .jpeg()
      .toBuffer();

    const { metadata } = await processed(withExif);

    expect(metadata.exif).toBeUndefined();
  });

  it("el hash depende del contenido: mismo escudo, mismo hash; otro escudo, otro hash", async () => {
    const first = await processed(fixture("escudo-600x300.png"));
    const again = await processed(fixture("escudo-600x300.png"));
    const other = await processed(fixture("escudo-300x300.jpg"));

    expect(first.hash).toMatch(/^[0-9a-f]{16}$/);
    expect(again.hash).toBe(first.hash);
    expect(other.hash).not.toBe(first.hash);
  });

  it("acepta un PNG de 1,9 MB", async () => {
    const image = await noisePng(800, 830);
    expect(image.length).toBeGreaterThan(1.9 * 1024 * 1024);
    expect(image.length).toBeLessThanOrEqual(MAX_CREST_BYTES);

    expect((await processCrest(image)).ok).toBe(true);
  });

  it("rechaza un archivo de más de 2 MB", async () => {
    const image = await noisePng(900, 900);
    expect(image.length).toBeGreaterThan(MAX_CREST_BYTES);

    expect(await processCrest(image)).toEqual(REJECTION);
  });

  it.each([
    ["un SVG", "escudo.svg"],
    ["un texto renombrado a .png", "texto-renombrado.png"],
    ["un GIF", "escudo.gif"],
  ])("rechaza %s indicando formatos y tamaño aceptados", async (_case, file) => {
    expect(await processCrest(fixture(file))).toEqual(REJECTION);
  });

  it("rechaza una imagen con demasiados píxeles aunque pese poco", async () => {
    const huge = await solidImage(12_000, 12_000, "png");
    expect(huge.length).toBeLessThan(MAX_CREST_BYTES);

    expect(await processCrest(huge)).toEqual(REJECTION);
  });
});
