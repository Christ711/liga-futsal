import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("falla nombrando DATABASE_URL cuando falta", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("falla nombrando DATABASE_URL cuando no es una URL de Postgres", () => {
    expect(() => parseEnv({ DATABASE_URL: "no-es-una-url" })).toThrow(/DATABASE_URL/);
  });

  it("devuelve las variables validadas cuando están completas", () => {
    const env = parseEnv({ DATABASE_URL: "postgresql://postgres@127.0.0.1:5433/liga_dev" });

    expect(env.DATABASE_URL).toBe("postgresql://postgres@127.0.0.1:5433/liga_dev");
  });
});
