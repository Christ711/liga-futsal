import { describe, expect, it } from "vitest";

import { goalsFor, matchScore, type Goal, type Match } from "./matches";

const goal = (teamId: string, scorerId: string | null = null): Goal => ({ teamId, scorerId });

const match = (goals: Goal[]): Match => ({ teamAId: "tigres", teamBId: "leones", goals });

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
    const original: Match = { teamAId: "tigres", teamBId: "leones", goals };
    const swapped: Match = { teamAId: "leones", teamBId: "tigres", goals };

    expect(matchScore(swapped)).toEqual({ teamA: 1, teamB: 2 });
    expect(goalsFor(swapped, "tigres")).toBe(goalsFor(original, "tigres"));
    expect(goalsFor(swapped, "leones")).toBe(goalsFor(original, "leones"));
  });
});
