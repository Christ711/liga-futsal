import { describe, expect, it } from "vitest";

import {
  withGoalAdded,
  withGoalReassigned,
  withGoalRemoved,
  withMatchMoved,
  withMatchStatus,
  type MatchdayView,
} from "./matchday-view";

const view: MatchdayView = {
  leagueId: "liga",
  matchday: { id: "fecha", number: 1, playDate: "2026-09-05", finalized: false },
  editable: true,
  teams: [
    { id: "tigres", name: "Tigres", crestHash: null, players: [{ id: "juan", name: "Juan" }] },
    { id: "leones", name: "Leones", crestHash: null, players: [{ id: "pedro", name: "Pedro" }] },
    { id: "pumas", name: "Pumas", crestHash: null, players: [] },
  ],
  matches: [
    {
      id: "m1",
      position: 1,
      teamAId: "tigres",
      teamBId: "leones",
      status: "pending",
      locked: false,
      goals: [{ id: "g1", teamId: "tigres", scorer: { id: "juan", name: "Juan" } }],
    },
    {
      id: "m2",
      position: 2,
      teamAId: "leones",
      teamBId: "pumas",
      status: "pending",
      locked: false,
      goals: [],
    },
    {
      id: "m3",
      position: 3,
      teamAId: "tigres",
      teamBId: "pumas",
      status: "pending",
      locked: false,
      goals: [],
    },
  ],
};

const match = (result: MatchdayView, id: string) => result.matches.find((m) => m.id === id)!;

describe("cambios optimistas de la vista de la fecha (ADR 011)", () => {
  it("agrega un gol con el nombre de su autor o como gol sin autor", () => {
    const withScorer = withGoalAdded(view, {
      id: "temporal",
      matchId: "m1",
      teamId: "leones",
      scorerId: "pedro",
    });
    const anonymous = withGoalAdded(view, {
      id: "temporal",
      matchId: "m2",
      teamId: "pumas",
      scorerId: null,
    });

    expect(match(withScorer, "m1").goals.at(-1)).toEqual({
      id: "temporal",
      teamId: "leones",
      scorer: { id: "pedro", name: "Pedro" },
    });
    expect(match(anonymous, "m2").goals).toEqual([
      { id: "temporal", teamId: "pumas", scorer: null },
    ]);
    // La vista original no cambia: la caché anterior sirve para revertir.
    expect(match(view, "m1").goals).toHaveLength(1);
  });

  it("quita y reasigna goles", () => {
    expect(match(withGoalRemoved(view, "g1"), "m1").goals).toEqual([]);
    expect(
      match(withGoalReassigned(view, { goalId: "g1", teamId: "leones", scorerId: null }), "m1")
        .goals,
    ).toEqual([{ id: "g1", teamId: "leones", scorer: null }]);
  });

  it("cambia el estado de un partido", () => {
    expect(match(withMatchStatus(view, "m2", "finished"), "m2").status).toBe("finished");
  });

  it("mueve un partido una posición y no hace nada en los extremos", () => {
    expect(withMatchMoved(view, "m3", "up").matches.map((m) => m.id)).toEqual(["m1", "m3", "m2"]);
    expect(withMatchMoved(view, "m1", "up").matches.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
    expect(withMatchMoved(view, "m3", "down").matches.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
    expect(withMatchMoved(view, "m3", "up").matches.map((m) => m.position)).toEqual([1, 2, 3]);
  });
});
