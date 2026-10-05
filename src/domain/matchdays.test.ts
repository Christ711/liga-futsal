import { describe, expect, it } from "vitest";

import { checkAddGoal, checkFinishMatch, type Match } from "./matches";
import {
  checkFinalizeMatchday,
  matchdayStatus,
  matchesToLock,
  numberMatchdays,
  validatePlayDate,
} from "./matchdays";

const day = (id: string, playDate: string) => ({ id, playDate });

describe("numberMatchdays", () => {
  it("numera desde 1 según el orden cronológico del día de juego", () => {
    const numbered = numberMatchdays([day("c", "2026-09-24"), day("a", "2026-09-10")]);

    expect(numbered).toEqual([
      { id: "a", playDate: "2026-09-10", number: 1 },
      { id: "c", playDate: "2026-09-24", number: 2 },
    ]);
  });

  it("renumera al borrar una fecha intermedia y crear otra entre las dos (escenario de RF-43)", () => {
    const before = numberMatchdays([
      day("a", "2026-09-10"),
      day("b", "2026-09-17"),
      day("c", "2026-09-24"),
    ]);
    expect(before.map((m) => [m.playDate, m.number])).toEqual([
      ["2026-09-10", 1],
      ["2026-09-17", 2],
      ["2026-09-24", 3],
    ]);

    // Se borra la del 17/09 y se genera una con día 20/09.
    const after = numberMatchdays([
      day("a", "2026-09-10"),
      day("c", "2026-09-24"),
      day("d", "2026-09-20"),
    ]);
    expect(after.map((m) => [m.playDate, m.number])).toEqual([
      ["2026-09-10", 1],
      ["2026-09-20", 2],
      ["2026-09-24", 3],
    ]);
  });

  it("una fecha con día anterior a todas pasa a ser la número 1", () => {
    const numbered = numberMatchdays([day("a", "2026-09-10"), day("z", "2026-08-30")]);

    expect(numbered.map((m) => [m.id, m.number])).toEqual([
      ["z", 1],
      ["a", 2],
    ]);
  });

  it("ordena bien entre meses y años distintos", () => {
    const numbered = numberMatchdays([
      day("c", "2027-01-05"),
      day("a", "2026-09-30"),
      day("b", "2026-10-02"),
    ]);

    expect(numbered.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("devuelve una lista vacía si la liga no tiene fechas y no modifica la entrada", () => {
    const input = [day("b", "2026-09-17"), day("a", "2026-09-10")];

    expect(numberMatchdays([])).toEqual([]);
    numberMatchdays(input);
    expect(input.map((m) => m.id)).toEqual(["b", "a"]);
  });

  it("falla si dos fechas comparten el día de juego", () => {
    expect(() => numberMatchdays([day("a", "2026-09-10"), day("b", "2026-09-10")])).toThrow(
      /mismo día/,
    );
  });
});

const game = (overrides: Partial<Match> = {}): Match => ({
  teamAId: "tigres",
  teamBId: "leones",
  goals: [],
  status: "pending",
  locked: false,
  ...overrides,
});
const pendingGame = game();
const finishedGame = game({ status: "finished" });
const lockedGame = game({ status: "finished", locked: true });

describe("matchdayStatus", () => {
  it("una fecha que nunca se finalizó está abierta, tenga o no partidos terminados", () => {
    expect(matchdayStatus({ finalized: false, matches: [pendingGame, pendingGame] })).toEqual({
      status: "open",
      pendingCount: 2,
    });
    expect(matchdayStatus({ finalized: false, matches: [finishedGame, finishedGame] })).toEqual({
      status: "open",
      pendingCount: 0,
    });
  });

  it("una fecha finalizada con partidos pendientes está incompleta e informa cuántos faltan", () => {
    const matches = [lockedGame, lockedGame, lockedGame, lockedGame, pendingGame, pendingGame];

    expect(matchdayStatus({ finalized: true, matches })).toEqual({
      status: "incomplete",
      pendingCount: 2,
    });
  });

  it("una fecha finalizada sin ningún partido terminado queda incompleta con todos pendientes", () => {
    expect(matchdayStatus({ finalized: true, matches: [pendingGame, pendingGame] })).toEqual({
      status: "incomplete",
      pendingCount: 2,
    });
  });

  it("una fecha finalizada sin partidos pendientes está finalizada", () => {
    expect(matchdayStatus({ finalized: true, matches: [lockedGame, lockedGame] })).toEqual({
      status: "finalized",
      pendingCount: 0,
    });
  });

  it("un partido pendiente de una fecha incompleta se juega con las mismas reglas que en una abierta", () => {
    const matches = [lockedGame, pendingGame];
    expect(matchdayStatus({ finalized: true, matches }).status).toBe("incomplete");

    expect(checkAddGoal(pendingGame, { teamId: "tigres", scorer: null }).ok).toBe(true);
    expect(checkFinishMatch(pendingGame).ok).toBe(true);
    expect(checkAddGoal(lockedGame, { teamId: "tigres", scorer: null }).ok).toBe(false);
  });
});

describe("matchesToLock", () => {
  const withId = (id: string, match: Match) => ({ id, ...match });

  it("al finalizar con 4 terminados y 2 pendientes bloquea solo los 4 terminados", () => {
    const matches = [
      withId("m1", finishedGame),
      withId("m2", finishedGame),
      withId("m3", pendingGame),
      withId("m4", finishedGame),
      withId("m5", pendingGame),
      withId("m6", finishedGame),
    ];

    expect(matchesToLock(matches)).toEqual(["m1", "m2", "m4", "m6"]);
  });

  it("al refinalizar tras terminar los 2 pendientes bloquea solo esos 2", () => {
    const matches = [
      withId("m1", lockedGame),
      withId("m2", lockedGame),
      withId("m3", finishedGame),
      withId("m4", lockedGame),
      withId("m5", finishedGame),
      withId("m6", lockedGame),
    ];

    expect(matchesToLock(matches)).toEqual(["m3", "m5"]);
  });

  it("no bloquea nada si todos los partidos siguen pendientes", () => {
    expect(matchesToLock([withId("m1", pendingGame), withId("m2", pendingGame)])).toEqual([]);
  });
});

describe("validatePlayDate (RF-97, RF-98)", () => {
  it("acepta un día real en formato AAAA-MM-DD", () => {
    expect(validatePlayDate(" 2026-10-03 ")).toEqual({ ok: true, data: "2026-10-03" });
    expect(validatePlayDate("2028-02-29")).toEqual({ ok: true, data: "2028-02-29" });
  });

  it.each(["", "2026-2-1", "03-10-2026", "2026-02-30", "2027-02-29", "2026-13-01", "hoy"])(
    "rechaza %j",
    (value) => {
      expect(validatePlayDate(value)).toEqual({
        ok: false,
        error: {
          code: "INVALID_PLAY_DATE",
          message: "Elige un día válido.",
          fields: { playDate: "Elige un día válido." },
        },
      });
    },
  );
});

describe("checkFinalizeMatchday (RF-49, RF-101, RF-102)", () => {
  const finished = { status: "finished" as const, locked: false };
  const locked = { status: "finished" as const, locked: true };
  const pending = { status: "pending" as const, locked: false };

  it("permite finalizar una fecha abierta, aunque tenga partidos pendientes", () => {
    expect(checkFinalizeMatchday({ finalized: false, matches: [finished, pending] })).toEqual({
      ok: true,
      data: null,
    });
  });

  it("permite volver a finalizar una fecha incompleta (RF-49)", () => {
    expect(checkFinalizeMatchday({ finalized: true, matches: [locked, pending] }).ok).toBe(true);
  });

  it("permite volver a finalizarla para bloquear los pendientes que ya se jugaron (RF-102)", () => {
    expect(checkFinalizeMatchday({ finalized: true, matches: [locked, finished] }).ok).toBe(true);
  });

  it("rechaza una fecha finalizada sin pendientes ni partidos por bloquear", () => {
    expect(checkFinalizeMatchday({ finalized: true, matches: [locked, locked] })).toMatchObject({
      ok: false,
      error: { code: "MATCHDAY_ALREADY_FINALIZED" },
    });
  });
});
