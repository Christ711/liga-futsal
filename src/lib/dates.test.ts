import { describe, expect, it } from "vitest";

import { formatDay } from "./dates";

describe("formatDay", () => {
  it("muestra el día en español de Chile, sin correrlo por la zona horaria", () => {
    expect(formatDay("2026-10-03")).toBe("sábado 3 de octubre de 2026");
    expect(formatDay("2026-01-01")).toBe("jueves 1 de enero de 2026");
  });
});
