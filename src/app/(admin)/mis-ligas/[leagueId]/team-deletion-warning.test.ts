import { describe, expect, it } from "vitest";

import { teamDeletionWarning } from "./team-deletion-warning";

describe("aviso al eliminar un equipo (RF-95, RF-96)", () => {
  it("cuenta los jugadores que se eliminan con el equipo", () => {
    expect(teamDeletionWarning({ playerCount: 2, hasCrest: false })).toBe(
      "También se eliminarán sus 2 jugadores. Esta acción no se puede deshacer.",
    );
    expect(teamDeletionWarning({ playerCount: 1, hasCrest: false })).toBe(
      "También se eliminará su jugador. Esta acción no se puede deshacer.",
    );
  });

  it("menciona el escudo solo si el equipo tiene uno", () => {
    expect(teamDeletionWarning({ playerCount: 3, hasCrest: true })).toBe(
      "También se eliminarán sus 3 jugadores y su escudo. Esta acción no se puede deshacer.",
    );
    expect(teamDeletionWarning({ playerCount: 0, hasCrest: true })).toBe(
      "El equipo no tiene jugadores. También se eliminará su escudo. Esta acción no se puede deshacer.",
    );
  });

  it("sin jugadores ni escudo, lo dice", () => {
    expect(teamDeletionWarning({ playerCount: 0, hasCrest: false })).toBe(
      "El equipo no tiene jugadores. Esta acción no se puede deshacer.",
    );
  });
});
