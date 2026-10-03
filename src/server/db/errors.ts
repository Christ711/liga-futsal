import "server-only";

import { Prisma } from "@/generated/prisma/client";

/** Verdadero si la escritura chocó con un índice único (código P2002 de Prisma). */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Verdadero si la escritura chocó con una clave foránea (código P2003 de Prisma). */
export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}
