import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { fail, ok, type Result } from "@/domain/result";

/** Peso máximo del archivo subido (RF-28). */
export const MAX_CREST_BYTES = 2 * 1024 * 1024;

/** Lado máximo del escudo guardado (RF-30). */
const CREST_SIZE = 256;

/**
 * Píxeles máximos de la imagen de entrada (plan D16): una imagen muy
 * comprimida puede pesar poco y aun así agotar la memoria al abrirla.
 */
const MAX_INPUT_PIXELS = 40_000_000;

const ACCEPTED_FORMATS = new Set(["png", "jpeg", "webp"]);

export type ProcessedCrest = {
  /** WebP de máximo 256 px, sin metadatos del original. */
  data: Buffer;
  /** Hash del contenido; versiona la URL del escudo (ADR 007). */
  hash: string;
};

/**
 * Valida un escudo por su contenido real, no por su extensión ni su tipo
 * declarado (RF-28, RF-29), y lo guarda reducido y recodificado (RF-30;
 * ADR 007). Recodificar descarta metadatos y cualquier contenido incrustado.
 */
export async function processCrest(file: Uint8Array): Promise<Result<ProcessedCrest>> {
  // El peso se revisa antes de decodificar nada.
  if (file.byteLength > MAX_CREST_BYTES) return fail("CREST_INVALID");

  try {
    const metadata = await sharp(file).metadata();
    if (!ACCEPTED_FORMATS.has(metadata.format)) return fail("CREST_INVALID");
    if (metadata.width * metadata.height > MAX_INPUT_PIXELS) return fail("CREST_INVALID");

    const data = await sharp(file, { limitInputPixels: MAX_INPUT_PIXELS })
      // Endereza las fotos según su orientación EXIF antes de descartarla.
      .rotate()
      .resize(CREST_SIZE, CREST_SIZE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 16);
    return ok({ data, hash });
  } catch {
    // sharp no reconoce el contenido como imagen o está dañado.
    return fail("CREST_INVALID");
  }
}
