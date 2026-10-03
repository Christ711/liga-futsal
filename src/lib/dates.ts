const DAY_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  // El día `YYYY-MM-DD` se interpreta a medianoche UTC; formatearlo en UTC
  // evita que la zona del servidor o del navegador lo corra un día (ADR 015).
  timeZone: "UTC",
});

/** Día de juego `YYYY-MM-DD` como texto, por ejemplo "sábado 3 de octubre de 2026". */
export function formatDay(day: string): string {
  return DAY_FORMATTER.format(new Date(`${day}T00:00:00Z`)).replace(",", "");
}
