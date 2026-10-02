import type { AppError } from "@/domain/result";

/** Estado que devuelve una Server Action de formulario cuando rechaza el envío (ADR 010). */
export type FormState = {
  error: AppError;
  /** Valores a conservar en el formulario; nunca incluye contraseñas. */
  values: Record<string, string>;
} | null;
