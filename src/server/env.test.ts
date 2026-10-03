import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://postgres@127.0.0.1:5433/liga_dev",
  BETTER_AUTH_SECRET: "un-secreto-de-prueba-con-mas-de-32-caracteres",
  INVITE_CODE: "codigo-de-prueba",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "1025",
  MAIL_FROM: "Liga Futsal <liga-futsal@example.com>",
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

  it("falla nombrando INVITE_CODE cuando falta o tiene menos de 8 caracteres", () => {
    expect(() => parseEnv({ ...valid, INVITE_CODE: undefined })).toThrow(/INVITE_CODE: falta/);
    expect(() => parseEnv({ ...valid, INVITE_CODE: "corto" })).toThrow(
      /INVITE_CODE: debe tener al menos 8/,
    );
  });

  it("acepta que BETTER_AUTH_URL no esté definida", () => {
    expect(parseEnv(valid).BETTER_AUTH_URL).toBeUndefined();
  });

  it("falla si BETTER_AUTH_URL no es una URL", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_URL: "liga-futsal" })).toThrow(/BETTER_AUTH_URL/);
  });

  it("nombra todas las variables inválidas a la vez", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL[\s\S]*BETTER_AUTH_SECRET[\s\S]*INVITE_CODE/);
  });

  it("falla nombrando las variables de correo cuando faltan", () => {
    expect(() => parseEnv({ ...valid, SMTP_HOST: undefined })).toThrow(/SMTP_HOST/);
    expect(() => parseEnv({ ...valid, SMTP_PORT: undefined })).toThrow(/SMTP_PORT/);
    expect(() => parseEnv({ ...valid, MAIL_FROM: undefined })).toThrow(/MAIL_FROM/);
  });

  it("exige SMTP_USER y SMTP_PASSWORD juntos", () => {
    expect(() => parseEnv({ ...valid, SMTP_USER: "cuenta@gmail.com" })).toThrow(
      /SMTP_PASSWORD: SMTP_USER y SMTP_PASSWORD deben definirse juntos/,
    );
    expect(
      parseEnv({ ...valid, SMTP_USER: "cuenta@gmail.com", SMTP_PASSWORD: "clave" }).SMTP_USER,
    ).toBe("cuenta@gmail.com");
  });

  it("convierte SMTP_PORT a número", () => {
    expect(parseEnv({ ...valid, SMTP_PORT: "465" }).SMTP_PORT).toBe(465);
  });

  it("devuelve las variables validadas cuando están completas", () => {
    const env = parseEnv({ ...valid, BETTER_AUTH_URL: "https://liga-futsal-nine.vercel.app" });

    expect(env).toEqual({
      ...valid,
      SMTP_PORT: 1025,
      BETTER_AUTH_URL: "https://liga-futsal-nine.vercel.app",
    });
  });
});
