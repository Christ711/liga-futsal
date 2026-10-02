import { describe, expect, it } from "vitest";

import { isSemesterOver, semesterOfDay, validateSemester } from "./semester";

describe("validateSemester", () => {
  it.each(["2026-1", "2026-2", "2030-1"])("acepta %s", (value) => {
    expect(validateSemester(value)).toEqual({ ok: true, data: value });
  });

  it.each([
    ["2026-3", "el semestre solo puede ser 1 o 2"],
    ["2026-0", "el semestre solo puede ser 1 o 2"],
    ["26-1", "el año lleva cuatro dígitos"],
    ["20260-1", "el año lleva cuatro dígitos"],
    ["2026-12", "sobra un dígito"],
    ["2026/1", "el separador es un guion"],
    ["2026-1 ", "no admite espacios"],
    ["", "vacío"],
    ["primer semestre", "texto libre"],
  ])("rechaza %j (%s)", (value) => {
    const result = validateSemester(value);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_SEMESTER");
  });
});

describe("semesterOfDay", () => {
  it.each([
    ["2026-01-01", "2026-1"],
    ["2026-03-15", "2026-1"],
    ["2026-07-31", "2026-1"],
    ["2026-08-01", "2026-2"],
    ["2026-10-02", "2026-2"],
    ["2026-12-31", "2026-2"],
    ["2027-01-01", "2027-1"],
  ])("el día %s pertenece al semestre %s", (day, semester) => {
    expect(semesterOfDay(day)).toBe(semester);
  });

  it("entrega un semestre que pasa la validación de formato", () => {
    expect(validateSemester(semesterOfDay("2026-08-01")).ok).toBe(true);
  });

  it.each(["2026-8-1", "01-08-2026", "2026-13-01", "2026-00-10", "hoy", ""])(
    "falla con un día mal formado: %j",
    (day) => {
      expect(() => semesterOfDay(day)).toThrow(/YYYY-MM-DD/);
    },
  );
});

describe("isSemesterOver", () => {
  it.each([
    ["2026-1", "2026-07-31", false, "último día del primer semestre"],
    ["2026-1", "2026-08-01", true, "primer día del segundo semestre"],
    ["2026-1", "2026-01-01", false, "primer día del propio semestre"],
    ["2026-2", "2026-12-31", false, "último día del segundo semestre"],
    ["2026-2", "2027-01-01", true, "primer día del año siguiente"],
    ["2026-2", "2026-03-10", false, "semestre que todavía no empieza"],
    ["2025-2", "2026-10-02", true, "semestre de un año anterior"],
    ["2027-1", "2026-10-02", false, "semestre de un año futuro"],
  ])("el semestre %s el día %s: terminado = %s (%s)", (semester, today, expected) => {
    expect(isSemesterOver(semester, today)).toBe(expected);
  });

  it.each(["2026-3", "26-1", ""])("falla con un semestre mal formado: %j", (semester) => {
    expect(() => isSemesterOver(semester, "2026-10-02")).toThrow(/AAAA-1 o AAAA-2/);
  });

  it("falla con un día mal formado", () => {
    expect(() => isSemesterOver("2026-1", "hoy")).toThrow(/YYYY-MM-DD/);
  });
});
