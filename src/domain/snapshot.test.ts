import { describe, expect, it } from "vitest";

import type { Match } from "./matches";
import { buildSnapshot } from "./snapshot";

const teams = [
  { id: "tigres", name: "Tigres" },
  { id: "leones", name: "Leones" },
];
const players = [
  { id: "juan", name: "Juan", teamId: "leones" },
  { id: "pedro", name: "Pedro", teamId: "leones" },
];

const match = (status: Match["status"], goals: Match["goals"]): Match => ({
  teamAId: "tigres",
  teamBId: "leones",
  status,
  locked: status === "finished",
  goals,
});

describe("buildSnapshot (RF-74, RF-75, RF-77)", () => {
  it("guarda las tablas solo con los partidos terminados, con descuentos y el equipo actual de cada goleador", () => {
    const snapshot = buildSnapshot({
      teams,
      players,
      // Juan marcó para Tigres y después pasó a Leones.
      matches: [
        match("finished", [{ teamId: "tigres", scorerId: "juan" }]),
        match("pending", [{ teamId: "leones", scorerId: "pedro" }]),
      ],
      deductions: [{ teamId: "tigres", points: 1, reason: "Atraso" }],
    });

    expect(snapshot.standings.map((row) => [row.teamName, row.played, row.points])).toEqual([
      ["Tigres", 1, 2],
      ["Leones", 1, 0],
    ]);
    expect(snapshot.standings[0]!.deductions).toEqual([{ points: 1, reason: "Atraso" }]);
    expect(snapshot.topScorers).toEqual([
      {
        position: 1,
        playerId: "juan",
        playerName: "Juan",
        teamId: "leones",
        teamName: "Leones",
        goals: 1,
      },
    ]);
  });

  it("una liga sin fechas queda con sus tablas en cero (RF-77)", () => {
    const snapshot = buildSnapshot({ teams, players, matches: [], deductions: [] });

    expect(snapshot.standings.every((row) => row.played === 0 && row.points === 0)).toBe(true);
    expect(snapshot.standings).toHaveLength(2);
    expect(snapshot.topScorers).toEqual([]);
  });
});
