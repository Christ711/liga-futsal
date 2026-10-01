import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/server/env";

// Driver pg por TCP en todos los entornos (ADR 004): Postgres de Docker en local
// y CI, y la URL con pooling de Neon en producción.
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}

// En desarrollo, la recarga en caliente reevalúa este módulo; se reutiliza el
// cliente para no abrir un pool de conexiones nuevo en cada recarga.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
