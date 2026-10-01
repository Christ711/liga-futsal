import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { now, today } from "./time";

describe("time", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("entrega el día de Chile y no el de UTC en la noche de verano (UTC-3)", () => {
    // 23:00 del 31 de diciembre en Chile; en UTC ya es 1 de enero.
    vi.setSystemTime(new Date("2026-01-01T02:00:00Z"));

    expect(today()).toBe("2025-12-31");
  });

  it("entrega el día de Chile y no el de UTC en la noche de invierno (UTC-4)", () => {
    // 23:30 del 31 de julio en Chile; en UTC ya es 1 de agosto.
    vi.setSystemTime(new Date("2026-08-01T03:30:00Z"));

    expect(today()).toBe("2026-07-31");
  });

  it("entrega el mismo día cuando UTC y Chile coinciden", () => {
    vi.setSystemTime(new Date("2026-08-01T15:00:00Z"));

    expect(today()).toBe("2026-08-01");
  });

  it("entrega el instante actual del reloj", () => {
    vi.setSystemTime(new Date("2026-08-01T15:00:00Z"));

    expect(now().toISOString()).toBe("2026-08-01T15:00:00.000Z");
  });
});
