import { describe, expect, it } from "vitest";

import { NAME_MAX_LENGTH, nameKey, validateName, type NameKind } from "./names";

const limits: [NameKind, number][] = [
  ["league", 60],
  ["team", 30],
  ["player", 40],
];

describe("nameKey", () => {
  it("ignora mayúsculas y espacios exteriores", () => {
    expect(nameKey(" Tigres ")).toBe(nameKey("tigres"));
    expect(nameKey("TIGRES")).toBe("tigres");
  });

  it("conserva los espacios interiores y distingue nombres distintos", () => {
    expect(nameKey("Los Tigres")).toBe("los tigres");
    expect(nameKey("Los Tigres")).not.toBe(nameKey("LosTigres"));
  });

  it("trata igual las mayúsculas acentuadas y la eñe", () => {
    expect(nameKey("ÑUBLE ÁGUILAS")).toBe(nameKey("ñuble águilas"));
  });

  it("trata igual una letra acentuada compuesta y una descompuesta", () => {
    const composed = "Águilas";
    const decomposed = "Águilas";

    expect(nameKey(composed)).toBe(nameKey(decomposed));
  });
});

describe("validateName", () => {
  it.each(limits)("define el máximo de %s en %i caracteres", (kind, max) => {
    expect(NAME_MAX_LENGTH[kind]).toBe(max);
  });

  it.each(limits)("acepta un nombre de %s con exactamente %i caracteres", (kind, max) => {
    const name = "a".repeat(max);

    expect(validateName(kind, name)).toEqual({ ok: true, data: { name, nameKey: name } });
  });

  it.each(limits)("rechaza un nombre de %s con un carácter más que %i", (kind, max) => {
    const result = validateName(kind, "a".repeat(max + 1));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NAME_TOO_LONG");
      expect(result.error.fields?.name).toContain(String(max));
    }
  });

  it.each(limits)("rechaza un nombre de %s vacío o de solo espacios", (kind) => {
    for (const raw of ["", "   ", "\t\n "]) {
      const result = validateName(kind, raw);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("NAME_REQUIRED");
    }
  });

  it("devuelve el nombre sin espacios exteriores y su nameKey", () => {
    expect(validateName("team", "  Los Tigres  ")).toEqual({
      ok: true,
      data: { name: "Los Tigres", nameKey: "los tigres" },
    });
  });

  it("mide el largo sin contar los espacios exteriores", () => {
    const result = validateName("team", `  ${"a".repeat(30)}  `);

    expect(result.ok).toBe(true);
  });

  it("cuenta cada carácter visible una vez, incluidos emojis y letras acentuadas", () => {
    expect(validateName("team", "⚽".repeat(30)).ok).toBe(true);
    expect(validateName("team", "⚽".repeat(31)).ok).toBe(false);
    expect(validateName("team", "Á".repeat(30)).ok).toBe(true);
  });
});
