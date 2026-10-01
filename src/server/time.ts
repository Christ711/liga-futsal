import "server-only";

/**
 * Único lector del reloj para días de calendario (ADR 015). Los usuarios están
 * en Chile y las funciones de Vercel corren en UTC, así que "hoy" se calcula
 * siempre en America/Santiago; el dominio lo recibe como parámetro.
 */
const TIME_ZONE = "America/Santiago";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Instante actual. Para marcas de tiempo técnicas, que se guardan en UTC. */
export function now(): Date {
  return new Date();
}

/** Día de calendario actual en Chile, como `YYYY-MM-DD`. */
export function today(): string {
  const parts = dayFormatter.formatToParts(now());
  const part = (type: "year" | "month" | "day") =>
    parts.find((candidate) => candidate.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
