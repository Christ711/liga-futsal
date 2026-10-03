import { describe, expect, it } from "vitest";

import { leaguesWarning } from "./leagues-warning";

describe("aviso de ligas al eliminar la cuenta (RF-91)", () => {
  it("sin ligas, dice que solo se elimina la cuenta", () => {
    expect(leaguesWarning({ inProgress: 0, finalized: 0 })).toBe(
      "No tienes ligas, así que solo se eliminará tu cuenta.",
    );
  });

  it("con una liga, dice si está en curso o finalizada", () => {
    expect(leaguesWarning({ inProgress: 1, finalized: 0 })).toBe(
      "También se eliminará tu liga en curso, con sus equipos, jugadores, fechas y escudos.",
    );
    expect(leaguesWarning({ inProgress: 0, finalized: 1 })).toBe(
      "También se eliminará tu liga finalizada, con sus equipos, jugadores, fechas y escudos.",
    );
  });

  it("con varias ligas, separa cuántas están en curso y cuántas finalizadas", () => {
    expect(leaguesWarning({ inProgress: 1, finalized: 1 })).toBe(
      "También se eliminarán tus 2 ligas (1 en curso y 1 finalizada), con sus equipos, jugadores, fechas y escudos.",
    );
    expect(leaguesWarning({ inProgress: 0, finalized: 3 })).toBe(
      "También se eliminarán tus 3 ligas (0 en curso y 3 finalizadas), con sus equipos, jugadores, fechas y escudos.",
    );
  });
});
