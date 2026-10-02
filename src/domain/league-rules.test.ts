import { describe, expect, it } from "vitest";

import {
  checkCanChangeTeams,
  checkCanDeletePlayer,
  checkCanGenerateMatchday,
  checkLeagueEditable,
  MIN_TEAMS_FOR_MATCHDAY,
} from "./league-rules";

const codeOf = (result: { ok: boolean; error?: { code: string } }) =>
  result.ok ? "OK" : result.error?.code;

describe("checkLeagueEditable (RF-76)", () => {
  it("permite modificar una liga en curso", () => {
    expect(codeOf(checkLeagueEditable({ status: "in_progress" }))).toBe("OK");
  });

  it("rechaza modificar una liga finalizada", () => {
    expect(codeOf(checkLeagueEditable({ status: "finalized" }))).toBe("LEAGUE_FINALIZED");
  });
});

describe("checkCanChangeTeams (RF-23, RF-24)", () => {
  it("permite agregar y eliminar equipos en una liga en curso sin fechas", () => {
    expect(codeOf(checkCanChangeTeams({ status: "in_progress", matchdayCount: 0 }))).toBe("OK");
  });

  it("rechaza agregar o eliminar equipos cuando la liga tiene al menos una fecha", () => {
    expect(codeOf(checkCanChangeTeams({ status: "in_progress", matchdayCount: 1 }))).toBe(
      "TEAMS_LOCKED",
    );
  });

  it("rechaza en una liga finalizada aunque ya no tenga fechas", () => {
    expect(codeOf(checkCanChangeTeams({ status: "finalized", matchdayCount: 0 }))).toBe(
      "LEAGUE_FINALIZED",
    );
  });
});

describe("checkCanDeletePlayer (RF-37)", () => {
  it("permite eliminar un jugador sin goles", () => {
    expect(codeOf(checkCanDeletePlayer({ status: "in_progress", goalCount: 0 }))).toBe("OK");
  });

  it("rechaza eliminar un jugador con al menos un gol y sugiere editar su nombre", () => {
    const result = checkCanDeletePlayer({ status: "in_progress", goalCount: 1 });

    expect(codeOf(result)).toBe("PLAYER_HAS_GOALS");
    if (!result.ok) expect(result.error.message).toMatch(/editar su nombre/);
  });

  it("rechaza en una liga finalizada", () => {
    expect(codeOf(checkCanDeletePlayer({ status: "finalized", goalCount: 0 }))).toBe(
      "LEAGUE_FINALIZED",
    );
  });
});

describe("checkCanGenerateMatchday (RF-41, RF-100)", () => {
  const ready = { status: "in_progress", teamCount: 4, hasOpenMatchday: false } as const;

  it("define el mínimo de equipos en 3", () => {
    expect(MIN_TEAMS_FOR_MATCHDAY).toBe(3);
  });

  it("permite generar una fecha con 3 o más equipos y sin fecha abierta", () => {
    expect(codeOf(checkCanGenerateMatchday(ready))).toBe("OK");
    expect(codeOf(checkCanGenerateMatchday({ ...ready, teamCount: 3 }))).toBe("OK");
  });

  it("rechaza con menos de 3 equipos e indica el mínimo", () => {
    const result = checkCanGenerateMatchday({ ...ready, teamCount: 2 });

    expect(codeOf(result)).toBe("NOT_ENOUGH_TEAMS");
    if (!result.ok) expect(result.error.message).toContain("3");
  });

  it("rechaza si la liga tiene una fecha abierta e indica que hay que finalizarla", () => {
    const result = checkCanGenerateMatchday({ ...ready, hasOpenMatchday: true });

    expect(codeOf(result)).toBe("MATCHDAY_OPEN");
    if (!result.ok) expect(result.error.message).toMatch(/finaliza/i);
  });

  it("rechaza en una liga finalizada", () => {
    expect(codeOf(checkCanGenerateMatchday({ ...ready, status: "finalized" }))).toBe(
      "LEAGUE_FINALIZED",
    );
  });
});
