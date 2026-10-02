import { fail, ok, type Result } from "./result";

export type NameKind = "league" | "team" | "player";

/** Largo máximo de cada nombre (RF-19, RF-27, RF-36). */
export const NAME_MAX_LENGTH = {
  league: 60,
  team: 30,
  player: 40,
} as const satisfies Record<NameKind, number>;

export type ValidName = {
  /** Nombre a guardar y mostrar, sin espacios exteriores. */
  name: string;
  /** Clave para comparar nombres ignorando mayúsculas y espacios exteriores. */
  nameKey: string;
};

/** Forma canónica de un nombre: sin espacios exteriores y con los acentos compuestos. */
function clean(raw: string): string {
  return raw.normalize("NFC").trim();
}

/**
 * Clave de comparación de un nombre (RF-18, RF-26, RF-35): dos nombres son el
 * mismo si sus claves coinciden. La unicidad la garantiza la base con un índice
 * único sobre esta clave.
 */
export function nameKey(raw: string): string {
  return clean(raw).toLowerCase();
}

/** Valida que un nombre no esté vacío ni supere el máximo de su tipo. */
export function validateName(kind: NameKind, raw: string): Result<ValidName> {
  const name = clean(raw);
  if (name === "") {
    return fail("NAME_REQUIRED", { fields: { name: "Escribe un nombre." } });
  }

  const max = NAME_MAX_LENGTH[kind];
  // Se cuentan caracteres, no unidades UTF-16: un emoji cuenta como uno.
  if (Array.from(name).length > max) {
    return fail("NAME_TOO_LONG", { fields: { name: `Usa como máximo ${max} caracteres.` } });
  }

  return ok({ name, nameKey: name.toLowerCase() });
}
