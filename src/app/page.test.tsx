import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout from "./layout";
import HomePage from "./page";

describe("layout raíz y página de inicio", () => {
  const html = renderToStaticMarkup(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );

  it("declara el idioma español de Chile en <html>", () => {
    expect(html).toMatch(/<html[^>]*lang="es-CL"/);
  });

  it("muestra un Button de shadcn/ui con clases de Tailwind", () => {
    const button = html.match(/<button[^>]*data-slot="button"[^>]*>/)?.[0];

    expect(button).toBeDefined();
    expect(button).toMatch(/class="[^"]*\bbg-primary\b[^"]*"/);
    expect(button).toMatch(/class="[^"]*\binline-flex\b[^"]*"/);
  });
});
