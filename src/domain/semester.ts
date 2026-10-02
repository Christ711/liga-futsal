import { fail, ok, type Result } from "./result";

/** Semestre académico con formato `AAAA-1` o `AAAA-2` (RF-16). */
export type Semester = string;

const SEMESTER_FORMAT = /^\d{4}-[12]$/;
const DAY_FORMAT = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Último mes del primer semestre: de enero a julio es `-1`, de agosto a diciembre `-2` (RF-17). */
const LAST_MONTH_OF_FIRST_SEMESTER = 7;

/** Acepta solo `AAAA-1` o `AAAA-2` (RF-16). */
export function validateSemester(value: string): Result<Semester> {
  if (!SEMESTER_FORMAT.test(value)) {
    return fail("INVALID_SEMESTER", {
      fields: { semester: "Usa el formato AAAA-1 o AAAA-2, por ejemplo 2026-2." },
    });
  }
  return ok(value);
}

/**
 * Semestre al que pertenece un día `YYYY-MM-DD` (RF-17). El día lo entrega el
 * módulo de tiempo del servidor; el dominio no lee el reloj.
 */
export function semesterOfDay(day: string): Semester {
  const match = DAY_FORMAT.exec(day);
  if (!match) {
    throw new Error(`Día inválido: se esperaba YYYY-MM-DD y se recibió "${day}".`);
  }
  const [, year, month] = match;
  const half = Number(month) <= LAST_MONTH_OF_FIRST_SEMESTER ? 1 : 2;
  return `${year}-${half}`;
}

/**
 * Indica si un semestre ya terminó respecto de "hoy" según el corte de RF-17
 * (RF-94): terminó cuando el semestre de hoy es posterior a él.
 */
export function isSemesterOver(semester: Semester, today: string): boolean {
  if (!SEMESTER_FORMAT.test(semester)) {
    throw new Error(`Semestre inválido: se esperaba AAAA-1 o AAAA-2 y se recibió "${semester}".`);
  }
  // Con el formato fijo `AAAA-N`, el orden alfabético coincide con el cronológico.
  return semester < semesterOfDay(today);
}
