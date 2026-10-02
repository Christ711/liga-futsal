import { describe, expect, it } from "vitest";

import type { Goal, Match } from "./matches";
import { computeStandings, computeTopScorers, type StandingsRow } from "./standings";

const team = (id: string) => ({ id, name: `Equipo ${id}` });

/** Partido `a` contra `b` con el marcador dado; los goles no tienen autor salvo que se indique. */
function game(
  a: string,
  goalsA: number,
  goalsB: number,
  b: string,
  overrides: Partial<Match> = {},
): Match {
  const goals: Goal[] = [
    ...Array.from({ length: goalsA }, () => ({ teamId: a, scorerId: null })),
    ...Array.from({ length: goalsB }, () => ({ teamId: b, scorerId: null })),
  ];
  return { teamAId: a, teamBId: b, goals, status: "finished", locked: false, ...overrides };
}

const rowOf = (rows: StandingsRow[], teamId: string) => {
  const row = rows.find((candidate) => candidate.teamId === teamId);
  if (!row) throw new Error(`No hay fila para ${teamId}`);
  return row;
};

describe("computeStandings: tabla básica (RF-59, RF-62, RF-63)", () => {
  const teams = [team("A"), team("B"), team("C")];

  it("calcula PJ, PG, PE, PP, GF, GC, DG y Pts con 3-1-0", () => {
    const rows = computeStandings({
      teams,
      matches: [game("A", 3, 1, "B"), game("A", 2, 2, "C"), game("B", 0, 1, "C")],
      deductions: [],
    });

    expect(rowOf(rows, "A")).toMatchObject({
      teamName: "Equipo A",
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      goalsFor: 5,
      goalsAgainst: 3,
      goalDifference: 2,
      points: 4,
    });
    expect(rowOf(rows, "B")).toMatchObject({
      played: 2,
      won: 0,
      drawn: 0,
      lost: 2,
      goalsFor: 1,
      goalsAgainst: 4,
      goalDifference: -3,
      points: 0,
    });
    expect(rowOf(rows, "C")).toMatchObject({
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 2,
      goalDifference: 1,
      points: 4,
    });
  });

  it("cuenta el resultado igual sin importar qué equipo es A y cuál es B", () => {
    const original = computeStandings({ teams, matches: [game("A", 3, 1, "B")], deductions: [] });
    const swapped = computeStandings({ teams, matches: [game("B", 1, 3, "A")], deductions: [] });

    expect(rowOf(swapped, "A")).toEqual(rowOf(original, "A"));
    expect(rowOf(swapped, "B")).toEqual(rowOf(original, "B"));
  });

  it("ignora los partidos pendientes aunque tengan goles", () => {
    const rows = computeStandings({
      teams,
      matches: [game("A", 3, 1, "B"), game("A", 5, 0, "C", { status: "pending" })],
      deductions: [],
    });

    expect(rowOf(rows, "A")).toMatchObject({ played: 1, goalsFor: 3, points: 3 });
    expect(rowOf(rows, "C")).toMatchObject({ played: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
  });

  it("un partido terminado 0-0 cuenta como empate", () => {
    const rows = computeStandings({ teams, matches: [game("A", 0, 0, "B")], deductions: [] });

    expect(rowOf(rows, "A")).toMatchObject({ played: 1, drawn: 1, points: 1 });
    expect(rowOf(rows, "B")).toMatchObject({ played: 1, drawn: 1, points: 1 });
  });

  it("incluye con todo en cero a los equipos sin partidos terminados", () => {
    const rows = computeStandings({ teams, matches: [], deductions: [] });

    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row).toMatchObject({
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
  });

  it("suma varios partidos entre los mismos equipos, uno por fecha", () => {
    const rows = computeStandings({
      teams,
      matches: [game("A", 1, 0, "B"), game("A", 0, 2, "B"), game("B", 1, 1, "A")],
      deductions: [],
    });

    expect(rowOf(rows, "A")).toMatchObject({ played: 3, won: 1, drawn: 1, lost: 1, points: 4 });
    expect(rowOf(rows, "B")).toMatchObject({ played: 3, won: 1, drawn: 1, lost: 1, points: 4 });
  });

  it("falla si un partido es de un equipo que no pertenece a la liga", () => {
    expect(() =>
      computeStandings({ teams, matches: [game("A", 1, 0, "Z")], deductions: [] }),
    ).toThrow(/no pertenece/);
  });
});

describe("computeStandings: descuentos de puntos (RF-64, RF-69, RF-70)", () => {
  const teams = [team("A"), team("B")];
  const matches = [game("A", 2, 0, "B"), game("A", 1, 1, "B")];

  it("resta a los puntos la suma de los descuentos del equipo", () => {
    const rows = computeStandings({
      teams,
      matches,
      deductions: [
        { teamId: "A", points: 1, reason: "Llegó tarde" },
        { teamId: "A", points: 2, reason: "No presentó camisetas" },
      ],
    });

    // 3 + 1 = 4 puntos de partidos, menos 3 de descuentos.
    expect(rowOf(rows, "A").points).toBe(1);
    expect(rowOf(rows, "B").points).toBe(1);
  });

  it("expone cada descuento con su motivo y su cantidad", () => {
    const rows = computeStandings({
      teams,
      matches,
      deductions: [
        { teamId: "A", points: 1, reason: "Llegó tarde" },
        { teamId: "A", points: 2, reason: "No presentó camisetas" },
      ],
    });

    expect(rowOf(rows, "A").deductions).toEqual([
      { points: 1, reason: "Llegó tarde" },
      { points: 2, reason: "No presentó camisetas" },
    ]);
    expect(rowOf(rows, "B").deductions).toEqual([]);
  });

  it("permite que los puntos queden negativos", () => {
    const rows = computeStandings({
      teams,
      matches: [],
      deductions: [{ teamId: "B", points: 3, reason: "Conducta" }],
    });

    expect(rowOf(rows, "B").points).toBe(-3);
  });

  it("los descuentos no cambian los partidos ni los goles", () => {
    const withDeduction = computeStandings({
      teams,
      matches,
      deductions: [{ teamId: "A", points: 2, reason: "Conducta" }],
    });
    const without = computeStandings({ teams, matches, deductions: [] });

    const stats = ({
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
    }: StandingsRow) => ({
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
    });
    expect(stats(rowOf(withDeduction, "A"))).toEqual(stats(rowOf(without, "A")));
  });

  it("falla si un descuento es de un equipo que no pertenece a la liga", () => {
    expect(() =>
      computeStandings({
        teams,
        matches: [],
        deductions: [{ teamId: "Z", points: 1, reason: "Conducta" }],
      }),
    ).toThrow(/no pertenece/);
  });
});

describe("computeStandings: orden y desempates (RF-65, RF-66, RF-107)", () => {
  const ranking = (rows: StandingsRow[]) => rows.map((row) => `${row.position}:${row.teamId}`);

  it("ordena por puntos de mayor a menor y asigna posiciones desde 1", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C")],
      matches: [game("C", 1, 0, "A"), game("C", 1, 0, "B"), game("A", 1, 0, "B")],
      deductions: [],
    });

    expect(ranking(rows)).toEqual(["1:C", "2:A", "3:B"]);
  });

  it("ordena por los puntos ya descontados", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B")],
      matches: [game("A", 1, 0, "B"), game("A", 0, 0, "B")],
      deductions: [{ teamId: "A", points: 4, reason: "Conducta" }],
    });

    // A: 4 - 4 = 0 puntos; B: 1 punto.
    expect(ranking(rows)).toEqual(["1:B", "2:A"]);
  });

  it("con iguales puntos, desempata por diferencia de gol", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C"), team("D")],
      matches: [game("A", 1, 0, "C"), game("B", 4, 0, "D")],
      deductions: [],
    });

    expect(ranking(rows).slice(0, 2)).toEqual(["1:B", "2:A"]);
  });

  it("con iguales puntos y diferencia de gol, desempata por goles a favor", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C"), team("D")],
      matches: [game("A", 2, 1, "C"), game("B", 4, 3, "D")],
      deductions: [],
    });

    expect(ranking(rows).slice(0, 2)).toEqual(["1:B", "2:A"]);
  });

  it("escenario 1: A y B con 7 puntos, DG +2 y 5 GF, y B ganó el único partido entre ellos", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C"), team("D")],
      matches: [
        game("A", 0, 1, "B"),
        game("A", 3, 2, "C"),
        game("A", 2, 0, "D"),
        game("A", 0, 0, "C"),
        game("B", 3, 2, "D"),
        game("B", 1, 1, "C"),
      ],
      deductions: [],
    });

    for (const id of ["A", "B"]) {
      expect(rowOf(rows, id)).toMatchObject({ points: 7, goalDifference: 2, goalsFor: 5 });
    }
    expect(ranking(rows).slice(0, 2)).toEqual(["1:B", "2:A"]);
  });

  it("escenario 2: A y B con 7 puntos, DG +2, 5 GF y sus partidos entre ellos empatados comparten posición", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C"), team("D")],
      matches: [
        game("A", 1, 1, "B"),
        game("A", 3, 2, "C"),
        game("A", 1, 0, "D"),
        game("B", 3, 2, "C"),
        game("B", 1, 0, "D"),
      ],
      deductions: [],
    });

    for (const id of ["A", "B"]) {
      expect(rowOf(rows, id)).toMatchObject({ points: 7, goalDifference: 2, goalsFor: 5 });
    }
    expect(rowOf(rows, "A").position).toBe(1);
    expect(rowOf(rows, "B").position).toBe(1);
  });

  it("escenario 3: A, B y C con 7 puntos, DG +2 y 5 GF; A suma 6 entre ellos y B y C suman 1", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C"), team("D"), team("E")],
      matches: [
        game("A", 1, 0, "B"),
        game("A", 1, 0, "C"),
        game("B", 1, 1, "C"),
        game("A", 3, 3, "D"),
        game("B", 2, 1, "D"),
        game("B", 2, 0, "E"),
        game("C", 2, 1, "D"),
        game("C", 2, 0, "E"),
      ],
      deductions: [],
    });

    for (const id of ["A", "B", "C"]) {
      expect(rowOf(rows, id)).toMatchObject({ points: 7, goalDifference: 2, goalsFor: 5 });
    }
    expect(rowOf(rows, "A").position).toBe(1);
    expect(rowOf(rows, "B").position).toBe(2);
    expect(rowOf(rows, "C").position).toBe(2);
    expect(rows[0]!.teamId).toBe("A");
  });

  it("el enfrentamiento directo se calcula una sola vez: los que siguen empatados no se vuelven a comparar", () => {
    // A, B y C llegan empatados con 6 puntos, DG +1 y 4 GF. Entre los tres: A 6, B 6, C 3.
    // A le ganó a B, pero no hay una segunda comparación solo entre ellos (RF-107).
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C"), team("D")],
      matches: [
        game("A", 3, 2, "B"),
        game("B", 1, 0, "C"),
        game("B", 1, 0, "C"),
        game("A", 1, 0, "C"),
        game("C", 1, 0, "A"),
        game("C", 3, 0, "D"),
      ],
      deductions: [],
    });

    for (const id of ["A", "B", "C"]) {
      expect(rowOf(rows, id)).toMatchObject({ points: 6, goalDifference: 1, goalsFor: 4 });
    }
    expect(rowOf(rows, "A").position).toBe(1);
    expect(rowOf(rows, "B").position).toBe(1);
    expect(rowOf(rows, "C").position).toBe(3);
    expect(rowOf(rows, "D").position).toBe(4);
  });

  it("tras una posición compartida, la siguiente posición salta los lugares ocupados", () => {
    const rows = computeStandings({
      teams: [team("A"), team("B"), team("C")],
      matches: [game("A", 1, 0, "C"), game("B", 1, 0, "C")],
      deductions: [],
    });

    expect(rowOf(rows, "A").position).toBe(1);
    expect(rowOf(rows, "B").position).toBe(1);
    expect(rowOf(rows, "C").position).toBe(3);
  });

  it("dentro de una posición compartida ordena por nombre, para que la tabla sea estable", () => {
    const rows = computeStandings({
      teams: [team("C"), team("B"), team("A")],
      matches: [],
      deductions: [],
    });

    expect(ranking(rows)).toEqual(["1:A", "1:B", "1:C"]);
  });
});

describe("computeTopScorers (RF-40, RF-56, RF-59, RF-71, RF-72)", () => {
  const teams = [team("tigres"), team("leones")];
  const player = (id: string, teamId: string) => ({ id, name: `Jugador ${id}`, teamId });
  const players = [
    player("juan", "tigres"),
    player("pedro", "leones"),
    player("luis", "leones"),
    player("sin-goles", "tigres"),
  ];
  const scored = (teamId: string, ...scorerIds: (string | null)[]): Goal[] =>
    scorerIds.map((scorerId) => ({ teamId, scorerId }));
  const played = (goals: Goal[], overrides: Partial<Match> = {}): Match => ({
    teamAId: "tigres",
    teamBId: "leones",
    goals,
    status: "finished",
    locked: false,
    ...overrides,
  });
  const ranking = (rows: ReturnType<typeof computeTopScorers>) =>
    rows.map((row) => `${row.position}:${row.playerId}:${row.goals}`);

  it("lista a cada jugador con al menos un gol, de mayor a menor", () => {
    const rows = computeTopScorers({
      teams,
      players,
      matches: [
        played([...scored("tigres", "juan", "juan", "juan"), ...scored("leones", "pedro")]),
        played([...scored("leones", "pedro")]),
      ],
    });

    expect(ranking(rows)).toEqual(["1:juan:3", "2:pedro:2"]);
    expect(rows[0]).toEqual({
      position: 1,
      playerId: "juan",
      playerName: "Jugador juan",
      teamId: "tigres",
      teamName: "Equipo tigres",
      goals: 3,
    });
  });

  it("no lista a los jugadores sin goles", () => {
    const rows = computeTopScorers({
      teams,
      players,
      matches: [played(scored("tigres", "juan"))],
    });

    expect(rows.map((row) => row.playerId)).toEqual(["juan"]);
  });

  it("los goles sin autor no suman a ningún jugador", () => {
    const rows = computeTopScorers({
      teams,
      players,
      matches: [played(scored("tigres", "juan", null, null))],
    });

    expect(ranking(rows)).toEqual(["1:juan:1"]);
  });

  it("no cuenta los goles de partidos pendientes", () => {
    const rows = computeTopScorers({
      teams,
      players,
      matches: [
        played(scored("tigres", "juan")),
        played(scored("leones", "pedro", "pedro"), { status: "pending" }),
      ],
    });

    expect(ranking(rows)).toEqual(["1:juan:1"]);
  });

  it("los jugadores con los mismos goles comparten posición y la siguiente salta", () => {
    const rows = computeTopScorers({
      teams,
      players,
      matches: [
        played([
          ...scored("tigres", "juan", "juan"),
          ...scored("leones", "pedro", "pedro", "luis"),
        ]),
      ],
    });

    expect(ranking(rows)).toEqual(["1:juan:2", "1:pedro:2", "3:luis:1"]);
  });

  it("un jugador traspasado conserva sus goles y aparece con su equipo actual", () => {
    // Juan marcó 3 goles para tigres y después fue traspasado a leones.
    const rows = computeTopScorers({
      teams,
      players: [player("juan", "leones"), player("pedro", "leones")],
      matches: [played(scored("tigres", "juan", "juan", "juan"))],
    });

    expect(rows[0]).toMatchObject({
      playerId: "juan",
      goals: 3,
      teamId: "leones",
      teamName: "Equipo leones",
    });
  });

  it("devuelve una tabla vacía si no hay goles con autor", () => {
    expect(computeTopScorers({ teams, players, matches: [] })).toEqual([]);
  });

  it("falla si un gol es de un jugador que no pertenece a la liga", () => {
    expect(() =>
      computeTopScorers({ teams, players, matches: [played(scored("tigres", "fantasma"))] }),
    ).toThrow(/no pertenece/);
  });
});
