import { describe, expect, it } from "vitest";

import { MAX_DEDUCTION_POINTS, REASON_MAX_LENGTH, validateDeduction } from "./deductions";

const codeOf = (result: { ok: boolean; error?: { code: string } }) =>
  result.ok ? "OK" : result.error?.code;

describe("validateDeduction (RF-67)", () => {
  it("acepta puntos enteros mayores que cero y limpia el motivo", () => {
    expect(validateDeduction({ points: " 3 ", reason: "  Tarjetas rojas " })).toEqual({
      ok: true,
      data: { points: 3, reason: "Tarjetas rojas" },
    });
  });

  it.each(["0", "-2", "1.5", "", "abc", "2e1", String(MAX_DEDUCTION_POINTS + 1)])(
    "rechaza %j como puntos",
    (points) => {
      const result = validateDeduction({ points, reason: "Motivo" });

      expect(codeOf(result)).toBe("INVALID_POINTS");
      expect(result.ok ? null : result.error.fields).toEqual({
        points: `Usa un número entero entre 1 y ${MAX_DEDUCTION_POINTS}.`,
      });
    },
  );

  it("acepta el máximo de puntos", () => {
    expect(codeOf(validateDeduction({ points: String(MAX_DEDUCTION_POINTS), reason: "x" }))).toBe(
      "OK",
    );
  });

  it("exige un motivo", () => {
    const result = validateDeduction({ points: "2", reason: "   " });

    expect(codeOf(result)).toBe("REASON_REQUIRED");
    expect(result.ok ? null : result.error.fields).toEqual({ reason: "Escribe un motivo." });
  });

  it("acepta 100 caracteres de motivo y rechaza 101", () => {
    expect(codeOf(validateDeduction({ points: "2", reason: "x".repeat(REASON_MAX_LENGTH) }))).toBe(
      "OK",
    );
    const result = validateDeduction({ points: "2", reason: "x".repeat(REASON_MAX_LENGTH + 1) });
    expect(codeOf(result)).toBe("REASON_TOO_LONG");
    expect(result.ok ? null : result.error.fields).toEqual({
      reason: "Usa como máximo 100 caracteres.",
    });
  });

  it("informa a la vez los errores de puntos y de motivo", () => {
    const result = validateDeduction({ points: "0", reason: "" });

    expect(codeOf(result)).toBe("INVALID_INPUT");
    expect(result.ok ? null : result.error.fields).toEqual({
      points: `Usa un número entero entre 1 y ${MAX_DEDUCTION_POINTS}.`,
      reason: "Escribe un motivo.",
    });
  });
});
