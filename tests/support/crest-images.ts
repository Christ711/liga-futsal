import { randomBytes } from "node:crypto";

import sharp from "sharp";

/**
 * PNG de ruido aleatorio: no se comprime, así que su peso es casi
 * `width × height × 3` bytes. Sirve para probar los límites de 2 MB (RF-28)
 * sin guardar archivos grandes en el repositorio.
 */
export async function noisePng(width: number, height: number): Promise<Buffer> {
  const pixels = randomBytes(width * height * 3);
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

/** Un escudo de un color, del tamaño y formato pedidos. */
export function solidImage(
  width: number,
  height: number,
  format: "png" | "jpeg" | "webp" | "gif",
  color = "#1d4ed8",
): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .toFormat(format)
    .toBuffer();
}
