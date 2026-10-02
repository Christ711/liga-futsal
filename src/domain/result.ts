/**
 * Contrato de resultado de los casos de uso y Server Actions (ADR 010).
 * Los rechazos esperables se devuelven con un `code` estable en inglés y un
 * `message` en español para mostrar; nunca se lanzan como excepción.
 */

/** Catálogo de códigos de rechazo con su mensaje en español. Cada tarea agrega los de sus RF. */
export const errorMessages = {
  INVALID_INPUT: "Revisa los datos ingresados.",
  INVALID_SEMESTER: "El semestre no tiene un formato válido.",
  LEAGUE_FINALIZED: "La liga está finalizada y ya no se puede modificar.",
  MATCHDAY_OPEN: "Hay una fecha abierta. Primero finaliza esa fecha.",
  MATCH_ALREADY_FINISHED: "El partido ya está terminado.",
  MATCH_LOCKED: "El partido ya no se puede modificar porque su fecha fue finalizada.",
  MATCH_NOT_FINISHED: "El partido todavía no está terminado.",
  NAME_REQUIRED: "El nombre es obligatorio.",
  NAME_TOO_LONG: "El nombre es demasiado largo.",
  NOT_ENOUGH_TEAMS: "Se necesitan al menos 3 equipos para generar una fecha.",
  PLAYER_HAS_GOALS:
    "El jugador tiene goles registrados y no se puede eliminar. Puedes editar su nombre.",
  SCORER_NOT_IN_TEAM: "Ese jugador no pertenece al equipo del gol.",
  TEAM_NOT_IN_MATCH: "Ese equipo no juega este partido.",
  TEAMS_LOCKED: "La liga ya tiene fechas: no se pueden agregar ni eliminar equipos.",
  UNEXPECTED_ERROR: "Ocurrió un error inesperado. Intenta de nuevo.",
} as const satisfies Record<string, string>;

export type ErrorCode = keyof typeof errorMessages;

export type AppError = {
  code: ErrorCode;
  message: string;
  /** Errores por campo del formulario, con el mensaje de cada uno en español. */
  fields?: Record<string, string>;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  options: { fields?: Record<string, string> } = {},
): Result<never> {
  const error: AppError = { code, message: errorMessages[code] };
  if (options.fields) {
    error.fields = options.fields;
  }
  return { ok: false, error };
}
