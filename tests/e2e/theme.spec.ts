import { expect, test, type Locator, type Page } from "@playwright/test";

type Rgb = [number, number, number];

/** Color calculado de una propiedad CSS, convertido a RGB pintándolo en un canvas (sirve para oklch). */
async function rgbOf(locator: Locator, property: "color" | "background-color"): Promise<Rgb> {
  return locator.evaluate((element, prop) => {
    const value = getComputedStyle(element).getPropertyValue(prop);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r!, g!, b!] as [number, number, number];
  }, property);
}

/** Contraste WCAG 2 entre dos colores. */
function contrast(a: Rgb, b: Rgb): number {
  const luminance = (rgb: Rgb) => {
    const [r, g, bl] = rgb.map((channel) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as Rgb;
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const isGreen = ([r, g, b]: Rgb) => g > r + 40 && g > b + 10;

async function openSignIn(page: Page) {
  await page.goto("/ingresar");
  return {
    header: page.getByRole("banner"),
    button: page.getByRole("main").getByRole("button", { name: "Ingresar" }),
    card: page.locator('[data-slot="card"]').first(),
    description: page.getByText("Para ayudantes a cargo de una liga."),
  };
}

test("el color principal es verde en botones y cabecera (plan D22)", async ({ page }) => {
  const { header, button } = await openSignIn(page);

  expect(isGreen(await rgbOf(button, "background-color"))).toBe(true);
  expect(isGreen(await rgbOf(header, "background-color"))).toBe(true);
});

test("el fondo es gris claro y las tarjetas son blancas", async ({ page }) => {
  const { card } = await openSignIn(page);

  const background = await rgbOf(page.locator("body"), "background-color");
  expect(background).not.toEqual([255, 255, 255]);
  expect(Math.min(...background)).toBeGreaterThan(235);
  expect(await rgbOf(card, "background-color")).toEqual([255, 255, 255]);
});

test("el texto mantiene un contraste de al menos 4,5:1", async ({ page }) => {
  const { header, button, card, description } = await openSignIn(page);
  const headerLink = header.getByRole("link", { name: "Liga Futsal" });

  const pairs: [string, Rgb, Rgb][] = [
    ["botón principal", await rgbOf(button, "color"), await rgbOf(button, "background-color")],
    ["cabecera", await rgbOf(headerLink, "color"), await rgbOf(header, "background-color")],
    [
      "texto secundario sobre tarjeta",
      await rgbOf(description, "color"),
      await rgbOf(card, "background-color"),
    ],
  ];
  for (const [name, text, background] of pairs) {
    expect(contrast(text, background), name).toBeGreaterThanOrEqual(4.5);
  }
});
