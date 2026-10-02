import { describe, expect, it } from "vitest";

import {
  countConsecutiveRepeats,
  roundRobinPairs,
  scheduleMatchday,
  type Pairing,
} from "./scheduling";

const teams = (count: number) => Array.from({ length: count }, (_, index) => `equipo-${index + 1}`);

/** Generador aleatorio determinista (mulberry32) para que los tests sean repetibles. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDS = Array.from({ length: 100 }, (_, index) => index + 1);

/** Clave de un par sin importar el orden de sus equipos (no hay local ni visita). */
const pairKey = (pair: Pairing) => [pair.teamAId, pair.teamBId].sort().join(" vs ");

describe("roundRobinPairs", () => {
  it.each([3, 4, 5, 6, 7, 8])("con %i equipos genera n(n-1)/2 pares", (count) => {
    expect(roundRobinPairs(teams(count))).toHaveLength((count * (count - 1)) / 2);
  });

  it.each([3, 4, 5, 6, 7, 8])("con %i equipos cada par aparece exactamente una vez", (count) => {
    const keys = roundRobinPairs(teams(count)).map(pairKey);

    expect(new Set(keys).size).toBe(keys.length);
    for (const a of teams(count)) {
      for (const b of teams(count)) {
        if (a < b) expect(keys).toContain([a, b].sort().join(" vs "));
      }
    }
  });

  it("ningún equipo juega contra sí mismo", () => {
    for (const pair of roundRobinPairs(teams(8))) {
      expect(pair.teamAId).not.toBe(pair.teamBId);
    }
  });

  it("falla si un equipo viene repetido", () => {
    expect(() => roundRobinPairs(["tigres", "leones", "tigres"])).toThrow(/repetido/);
  });
});

describe("countConsecutiveRepeats", () => {
  const pair = (teamAId: string, teamBId: string): Pairing => ({ teamAId, teamBId });

  it("cuenta los pares de partidos consecutivos que comparten un equipo", () => {
    const order = [
      pair("A", "B"),
      pair("C", "D"),
      pair("A", "C"),
      pair("B", "D"),
      pair("A", "D"),
      pair("B", "C"),
    ];

    // C repite en C-D y A-C; D repite en B-D y A-D.
    expect(countConsecutiveRepeats(order)).toBe(2);
  });

  it("da cero cuando ningún equipo juega dos partidos seguidos", () => {
    expect(countConsecutiveRepeats([pair("A", "B"), pair("C", "D"), pair("A", "E")])).toBe(0);
  });

  it("da cero con cero o un partido", () => {
    expect(countConsecutiveRepeats([])).toBe(0);
    expect(countConsecutiveRepeats([pair("A", "B")])).toBe(0);
  });
});

describe("scheduleMatchday: mínimo de partidos consecutivos del mismo equipo (RF-44)", () => {
  it.each([
    [3, 2],
    [4, 2],
    [5, 0],
    [6, 0],
    [7, 0],
    [8, 0],
  ])("con %i equipos, las 100 semillas dan exactamente %i consecutivos", (count, minimum) => {
    for (const seed of SEEDS) {
      const order = scheduleMatchday({ teamIds: teams(count), random: seededRandom(seed) });

      expect(countConsecutiveRepeats(order)).toBe(minimum);
    }
  });

  it.each([3, 4, 5, 6, 7, 8])(
    "con %i equipos el orden contiene cada par exactamente una vez",
    (count) => {
      const expected = roundRobinPairs(teams(count)).map(pairKey).sort();

      for (const seed of SEEDS) {
        const order = scheduleMatchday({ teamIds: teams(count), random: seededRandom(seed) });

        expect(order.map(pairKey).sort()).toEqual(expected);
      }
    },
  );

  it("semillas distintas producen órdenes distintos", () => {
    const orders = new Set(
      SEEDS.map((seed) =>
        scheduleMatchday({ teamIds: teams(4), random: seededRandom(seed) })
          .map(pairKey)
          .join(" | "),
      ),
    );

    expect(orders.size).toBeGreaterThan(10);
  });

  it("la misma semilla produce siempre el mismo orden", () => {
    const first = scheduleMatchday({ teamIds: teams(6), random: seededRandom(42) });
    const second = scheduleMatchday({ teamIds: teams(6), random: seededRandom(42) });

    expect(second).toEqual(first);
  });

  it("con 10 equipos (45 partidos) encuentra un orden sin consecutivos en menos de 1 segundo", () => {
    const start = performance.now();
    const order = scheduleMatchday({ teamIds: teams(10), random: seededRandom(7) });

    expect(countConsecutiveRepeats(order)).toBe(0);
    expect(order).toHaveLength(45);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

describe("scheduleMatchday: el primer partido no repite el de la fecha anterior (RF-45)", () => {
  const AB: Pairing = { teamAId: "A", teamBId: "B" };
  const BA: Pairing = { teamAId: "B", teamBId: "A" };

  it("con 4 equipos y una fecha anterior que abrió con A-B, no abre con A-B y mantiene el mínimo de 2 consecutivos", () => {
    for (const seed of SEEDS) {
      const order = scheduleMatchday({
        teamIds: ["A", "B", "C", "D"],
        previousOpener: AB,
        random: seededRandom(seed),
      });

      expect(pairKey(order[0]!)).not.toBe("A vs B");
      expect(countConsecutiveRepeats(order)).toBe(2);
      expect(order).toHaveLength(6);
    }
  });

  it("con 3 equipos y una fecha anterior que abrió con A-B, abre con A-C o B-C", () => {
    for (const seed of SEEDS) {
      const order = scheduleMatchday({
        teamIds: ["A", "B", "C"],
        previousOpener: AB,
        random: seededRandom(seed),
      });

      expect(order).toHaveLength(3);
      expect(["A vs C", "B vs C"]).toContain(pairKey(order[0]!));
    }
  });

  it("reconoce el par anterior aunque venga con los equipos en el otro orden", () => {
    for (const seed of SEEDS) {
      const order = scheduleMatchday({
        teamIds: ["A", "B", "C", "D"],
        previousOpener: BA,
        random: seededRandom(seed),
      });

      expect(pairKey(order[0]!)).not.toBe("A vs B");
    }
  });

  it("con 5 equipos cumple a la vez cero consecutivos y un primer partido distinto", () => {
    for (const seed of SEEDS) {
      const order = scheduleMatchday({
        teamIds: ["A", "B", "C", "D", "E"],
        previousOpener: AB,
        random: seededRandom(seed),
      });

      expect(pairKey(order[0]!)).not.toBe("A vs B");
      expect(countConsecutiveRepeats(order)).toBe(0);
    }
  });

  it("sin fecha anterior no aplica la restricción: A-B puede abrir", () => {
    const openers = new Set(
      SEEDS.map((seed) =>
        pairKey(
          scheduleMatchday({ teamIds: ["A", "B", "C", "D"], random: seededRandom(seed) })[0]!,
        ),
      ),
    );

    expect(openers).toContain("A vs B");
    expect(openers.size).toBe(6);
  });

  it("con la restricción, los demás pares siguen pudiendo abrir", () => {
    const openers = new Set(
      SEEDS.map((seed) =>
        pairKey(
          scheduleMatchday({
            teamIds: ["A", "B", "C", "D"],
            previousOpener: AB,
            random: seededRandom(seed),
          })[0]!,
        ),
      ),
    );

    expect(openers.size).toBe(5);
  });
});
