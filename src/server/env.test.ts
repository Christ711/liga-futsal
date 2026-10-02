import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://postgres@127.0.0.1:5433/liga_dev",
  BETTER_AUTH_SECRET: "un-secreto-de-prueba-con-mas-de-32-caracteres",
};

describe("parseEnv", () => {
  it("falla nombrando DATABASE_URL cuando falta", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("falla nombrando DATABASE_URL cuando no es una URL de Postgres", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "no-es-una-url" })).toThrow(/DATABASE_URL/);
  });

  it("falla nombrando BETTER_AUTH_SECRET cuando falta", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_SECRET: undefined })).toThrow(
      /BETTER_AUTH_SECRET: falta/,
    );
  });

  it("falla si BETTER_AUTH_SECRET tiene menos de 32 caracteres", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_SECRET: "corto" })).toThrow(
      /BETTER_AUTH_SECRET: debe tener al menos 32/,
    );
  });

  it("acepta que BETTER_AUTH_URL no esté definida", () => {
    expect(parseEnv(valid).BETTER_AUTH_URL).toBeUndefined();
  });

  it("falla si BETTER_AUTH_URL no es una URL", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_URL: "liga-futsal" })).toThrow(/BETTER_AUTH_URL/);
  });

  it("nombra todas las variables inválidas a la vez", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL[\s\S]*BETTER_AUTH_SECRET/);
  });

  it("devuelve las variables validadas cuando están completas", () => {
    const env = parseEnv({ ...valid, BETTER_AUTH_URL: "https://liga-futsal-nine.vercel.app" });

    expect(env).toEqual({ ...valid, BETTER_AUTH_URL: "https://liga-futsal-nine.vercel.app" });
  });
});
