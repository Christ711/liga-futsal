import { describe, expect, it } from "vitest";

import {
  checkAddGoal,
  checkFinishMatch,
  checkReassignGoal,
  checkRemoveGoal,
  checkRevertMatch,
  goalsFor,
  matchScore,
  type Goal,
  type Match,
  type NewGoal,
} from "./matches";

const goal = (teamId: string, scorerId: string | null = null): Goal => ({ teamId, scorerId });

const match = (goals: Goal[], overrides: Partial<Match> = {}): Match => ({
  teamAId: "tigres",
  teamBId: "leones",
  goals,
  status: "pending",
  locked: false,
  ...overrides,
});

describe("goalsFor", () => {
  it("cuenta los goles registrados a favor de cada equipo", () => {
    const played = match([goal("tigres", "juan"), goal("leones", "pedro"), goal("tigres", "juan")]);

    expect(goalsFor(played, "tigres")).toBe(2);
    expect(goalsFor(played, "leones")).toBe(1);
  });

  it("suma los goles sin autor al marcador de su equipo", () => {
    const played = match([goal("tigres", "juan"), goal("tigres", null), goal("leones", "pedro")]);

    expect(goalsFor(played, "tigres")).toBe(2);
    expect(goalsFor(played, "leones")).toBe(1);
  });

  it("da cero a un equipo sin goles", () => {
    expect(goalsFor(match([]), "tigres")).toBe(0);
  });

  it("falla si se pregunta por un equipo que no juega el partido", () => {
    expect(() => goalsFor(match([]), "pumas")).toThrow(/no juega/);
  });

  it("falla si un gol es de un equipo que no juega el partido", () => {
    expect(() => goalsFor(match([goal("pumas")]), "tigres")).toThrow(/no juega/);
  });
});

describe("matchScore", () => {
  it("entrega 2-1 con 2 goles de A (uno sin autor) y 1 de B", () => {
    const played = match([goal("tigres", "juan"), goal("tigres", null), goal("leones", "pedro")]);

    expect(matchScore(played)).toEqual({ teamA: 2, teamB: 1 });
  });

  it("entrega 0-0 en un partido sin goles", () => {
    expect(matchScore(match([]))).toEqual({ teamA: 0, teamB: 0 });
  });

  it("no distingue local ni visita: invertir los equipos solo invierte el marcador", () => {
    const goals = [goal("tigres", "juan"), goal("tigres", null), goal("leones", "pedro")];
    const original = match(goals);
    const swapped = match(goals, { teamAId: "leones", teamBId: "tigres" });

    expect(matchScore(swapped)).toEqual({ teamA: 1, teamB: 2 });
    expect(goalsFor(swapped, "tigres")).toBe(goalsFor(original, "tigres"));
    expect(goalsFor(swapped, "leones")).toBe(goalsFor(original, "leones"));
  });
});

const pending = match([goal("tigres", "juan")]);
const finished = match([goal("tigres", "juan")], { status: "finished" });
const locked = match([goal("tigres", "juan")], { status: "finished", locked: true });

const byJuan: NewGoal = { teamId: "tigres", scorer: { id: "juan", teamId: "tigres" } };
const withoutScorer: NewGoal = { teamId: "leones", scorer: null };

const codeOf = (result: { ok: boolean; error?: { code: string } }) =>
  result.ok ? "OK" : result.error?.code;

describe("checkAddGoal y checkReassignGoal", () => {
  it.each([
    ["checkAddGoal", checkAddGoal],
    ["checkReassignGoal", checkReassignGoal],
  ])(
    "%s acepta un jugador actual o un gol sin autor de cualquiera de los dos equipos",
    (_, check) => {
      for (const current of [pending, finished]) {
        expect(codeOf(check(current, byJuan))).toBe("OK");
        expect(codeOf(check(current, withoutScorer))).toBe("OK");
        expect(
          codeOf(check(current, { teamId: "leones", scorer: { id: "pedro", teamId: "leones" } })),
        ).toBe("OK");
      }
    },
  );

  it.each([
    ["checkAddGoal", checkAddGoal],
    ["checkReassignGoal", checkReassignGoal],
  ])("%s rechaza con MATCH_LOCKED si el partido está bloqueado", (_, check) => {
    expect(codeOf(check(locked, byJuan))).toBe("MATCH_LOCKED");
  });

  it.each([
    ["checkAddGoal", checkAddGoal],
    ["checkReassignGoal", checkReassignGoal],
  ])("%s rechaza un equipo que no juega el partido", (_, check) => {
    expect(codeOf(check(pending, { teamId: "pumas", scorer: null }))).toBe("TEAM_NOT_IN_MATCH");
  });

  it.each([
    ["checkAddGoal", checkAddGoal],
    ["checkReassignGoal", checkReassignGoal],
  ])("%s rechaza un jugador que hoy no pertenece al equipo del gol", (_, check) => {
    const transferred: NewGoal = { teamId: "tigres", scorer: { id: "juan", teamId: "leones" } };

    expect(codeOf(check(pending, transferred))).toBe("SCORER_NOT_IN_TEAM");
  });
});

describe("checkRemoveGoal", () => {
  it("permite quitar un gol de un partido pendiente o terminado no bloqueado", () => {
    expect(codeOf(checkRemoveGoal(pending))).toBe("OK");
    expect(codeOf(checkRemoveGoal(finished))).toBe("OK");
  });

  it("rechaza con MATCH_LOCKED si el partido está bloqueado", () => {
    expect(codeOf(checkRemoveGoal(locked))).toBe("MATCH_LOCKED");
  });
});

describe("checkFinishMatch", () => {
  it("permite terminar un partido pendiente, incluido un 0-0", () => {
    expect(codeOf(checkFinishMatch(pending))).toBe("OK");
    expect(codeOf(checkFinishMatch(match([])))).toBe("OK");
  });

  it("rechaza terminar un partido que ya está terminado", () => {
    expect(codeOf(checkFinishMatch(finished))).toBe("MATCH_ALREADY_FINISHED");
  });

  it("rechaza con MATCH_LOCKED si el partido está bloqueado", () => {
    expect(codeOf(checkFinishMatch(locked))).toBe("MATCH_LOCKED");
  });
});

describe("checkRevertMatch", () => {
  it("permite devolver a pendiente un partido terminado no bloqueado", () => {
    expect(codeOf(checkRevertMatch(finished))).toBe("OK");
  });

  it("rechaza devolver un partido que sigue pendiente", () => {
    expect(codeOf(checkRevertMatch(pending))).toBe("MATCH_NOT_FINISHED");
  });

  it("rechaza con MATCH_LOCKED si el partido está bloqueado", () => {
    expect(codeOf(checkRevertMatch(locked))).toBe("MATCH_LOCKED");
  });
});
