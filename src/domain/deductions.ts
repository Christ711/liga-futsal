import { fail, ok, type Result } from "./result";

/** Largo máximo del motivo de un descuento (RF-67). */
export const REASON_MAX_LENGTH = 100;

/**
 * Tope de puntos de un descuento. La spec solo pide un entero mayor que cero
 * (RF-67); el tope evita valores absurdos y desbordar la columna entera.
 */
export const MAX_DEDUCTION_POINTS = 999;

const INTEGER = /^\d+$/;

export type ValidDeduction = { points: number; reason: string };

/** Valida los puntos y el motivo de un descuento, informando ambos campos a la vez (RF-67). */
export function validateDeduction(input: {
  points: string;
  reason: string;
}): Result<ValidDeduction> {
  const fields: Record<string, string> = {};
  let code: "INVALID_POINTS" | "REASON_REQUIRED" | "REASON_TOO_LONG" | null = null;

  const rawPoints = input.points.trim();
  const points = Number(rawPoints);
  if (!INTEGER.test(rawPoints) || points < 1 || points > MAX_DEDUCTION_POINTS) {
    fields.points = `Usa un número entero entre 1 y ${MAX_DEDUCTION_POINTS}.`;
    code = "INVALID_POINTS";
  }

  const reason = input.reason.normalize("NFC").trim();
  if (reason === "") {
    fields.reason = "Escribe un motivo.";
    code ??= "REASON_REQUIRED";
  } else if (Array.from(reason).length > REASON_MAX_LENGTH) {
    fields.reason = `Usa como máximo ${REASON_MAX_LENGTH} caracteres.`;
    code ??= "REASON_TOO_LONG";
  }

  if (code === null) return ok({ points, reason });
  return fail(Object.keys(fields).length > 1 ? "INVALID_INPUT" : code, { fields });
}
