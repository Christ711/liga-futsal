import { describe, expect, it } from "vitest";

import { errorMessages, fail, ok } from "./result";

describe("result", () => {
  it("construye un resultado exitoso con sus datos", () => {
    const result = ok({ id: "liga-1" });

    expect(result).toEqual({ ok: true, data: { id: "liga-1" } });
  });

  it("construye un rechazo con code estable y message en español del catálogo", () => {
    const result = fail("INVALID_INPUT", { fields: { name: "El nombre es obligatorio." } });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "Revisa los datos ingresados.",
        fields: { name: "El nombre es obligatorio." },
      },
    });
  });

  it("omite fields cuando el rechazo no los tiene", () => {
    const result = fail("UNEXPECTED_ERROR");

    expect(result).toEqual({
      ok: false,
      error: { code: "UNEXPECTED_ERROR", message: errorMessages.UNEXPECTED_ERROR },
    });
  });

  it("tiene un mensaje en español no vacío para cada código del catálogo", () => {
    for (const message of Object.values(errorMessages)) {
      expect(message.trim()).not.toBe("");
    }
  });
});
