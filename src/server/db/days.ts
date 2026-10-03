import "server-only";

/**
 * Conversión entre días `YYYY-MM-DD` del dominio y columnas `date` de Prisma
 * (plan D15). Prisma representa un `date` como medianoche UTC, así que se
 * convierte en UTC para que la zona del servidor no corra el día.
 */
export function toDbDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function fromDbDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
