import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeView } from "./home-view";

describe("portada (RF-80, RF-108)", () => {
  it("sin ligas en curso muestra el mensaje en lugar de la lista", () => {
    const html = renderToStaticMarkup(<HomeView inProgress={[]} finalized={[]} />);

    expect(html).toContain("No hay ligas en curso por ahora");
    expect(html).toContain("Todavía no hay ligas finalizadas.");
  });

  it("agrupa por semestre en el orden recibido, con enlaces a cada liga", () => {
    const html = renderToStaticMarkup(
      <HomeView
        inProgress={[
          { semester: "2026-2", leagues: [{ id: "a", name: "Futsal martes" }] },
          { semester: "2026-1", leagues: [{ id: "b", name: "Fútbol jueves" }] },
        ]}
        finalized={[]}
      />,
    );

    expect(html.indexOf("Semestre 2026-2")).toBeLessThan(html.indexOf("Semestre 2026-1"));
    expect(html).toContain('href="/ligas/a"');
    expect(html).not.toContain("No hay ligas en curso por ahora");
  });
});
