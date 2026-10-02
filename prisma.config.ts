import { defineConfig } from "prisma/config";

// Prisma 7 no lee .env por su cuenta. En local se carga con el lector nativo de
// Node; en CI y en Vercel las variables ya vienen del entorno.
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables del entorno.
}

// Las migraciones usan la conexión directa cuando existe (en Neon,
// DATABASE_URL_UNPOOLED): el pooler no soporta todo lo que usa Prisma Migrate.
// En local y en CI solo existe DATABASE_URL, que ya es directa.
const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // La URL solo se declara si existe: `prisma generate` (que corre en cada
  // instalación) no la necesita, y los comandos de migración fallan con un
  // error claro si falta.
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
