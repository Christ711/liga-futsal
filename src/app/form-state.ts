import type { AppError } from "@/domain/result";

/** Estado que devuelve una Server Action de formulario cuando rechaza el envío (ADR 010). */
export type FormState = {
  error: AppError;
  /** Valores a conservar en el formulario; nunca incluye contraseñas. */
  values: Record<string, string>;
} | null;

/**
 * Estado de un formulario que se queda en la página: rechazo con los valores a
 * conservar, o éxito con un aviso para mostrar.
 */
export type NoticeFormState =
  | { ok: false; error: AppError; values: Record<string, string> }
  | { ok: true; notice: string }
  | null;
