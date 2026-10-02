import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

// El layout raíz lee la sesión del servidor y no se puede renderizar fuera de
// Next.js; su `lang="es-CL"` lo verifica el E2E de la portada.
describe("página de inicio", () => {
  const html = renderToStaticMarkup(<HomePage />);

  it("muestra un Button de shadcn/ui con clases de Tailwind", () => {
    const button = html.match(/<button[^>]*data-slot="button"[^>]*>/)?.[0];

    expect(button).toBeDefined();
    expect(button).toMatch(/class="[^"]*\bbg-primary\b[^"]*"/);
    expect(button).toMatch(/class="[^"]*\binline-flex\b[^"]*"/);
  });
});
