import { describe, expect, it } from "vitest";

import { lockoutEndsAt, MAX_FAILED_ATTEMPTS, WINDOW_MINUTES } from "./login-lockout";

/** Instante a `minutes` minutos (con decimales) de las 12:00 UTC del 2026-10-02. */
const at = (minutes: number) => new Date(Date.UTC(2026, 9, 2, 12, 0, 0) + minutes * 60_000);

describe("lockoutEndsAt (RF-7)", () => {
  it("usa 5 intentos fallidos en 15 minutos", () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5);
    expect(WINDOW_MINUTES).toBe(15);
  });

  it("4 fallos en 15 minutos no bloquean", () => {
    const failures = [at(0), at(1), at(2), at(3)];

    expect(lockoutEndsAt(failures, at(3.5))).toBeNull();
  });

  it("5 fallos en 15 minutos bloquean hasta 15 minutos después del quinto", () => {
    const failures = [at(0), at(1), at(2), at(3), at(4)];

    expect(lockoutEndsAt(failures, at(4))).toEqual(at(19));
    expect(lockoutEndsAt(failures, at(10))).toEqual(at(19));
    expect(lockoutEndsAt(failures, at(18.99))).toEqual(at(19));
  });

  it("el bloqueo termina exactamente 15 minutos después del quinto fallo", () => {
    const failures = [at(0), at(1), at(2), at(3), at(4)];

    expect(lockoutEndsAt(failures, at(19))).toBeNull();
    expect(lockoutEndsAt(failures, at(30))).toBeNull();
  });

  it("5 fallos repartidos en más de 15 minutos no bloquean", () => {
    const failures = [at(0), at(4), at(8), at(12), at(15.01)];

    expect(lockoutEndsAt(failures, at(15.02))).toBeNull();
  });

  it("5 fallos en exactamente 15 minutos sí bloquean", () => {
    const failures = [at(0), at(4), at(8), at(12), at(15)];

    expect(lockoutEndsAt(failures, at(15))).toEqual(at(30));
  });

  it("detecta 5 fallos seguidos aunque haya fallos antiguos antes", () => {
    const failures = [at(-200), at(-100), at(0), at(1), at(2), at(3), at(4)];

    expect(lockoutEndsAt(failures, at(5))).toEqual(at(19));
  });

  it("un fallo después de terminado el bloqueo no vuelve a bloquear por sí solo", () => {
    const failures = [at(0), at(1), at(2), at(3), at(4), at(20)];

    expect(lockoutEndsAt(failures, at(20))).toBeNull();
  });

  it("no depende del orden en que llegan los fallos", () => {
    const failures = [at(4), at(0), at(3), at(1), at(2)];

    expect(lockoutEndsAt(failures, at(5))).toEqual(at(19));
  });

  it("sin fallos no hay bloqueo", () => {
    expect(lockoutEndsAt([], at(0))).toBeNull();
  });
});
