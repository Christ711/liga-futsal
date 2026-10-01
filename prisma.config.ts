import { defineConfig } from "prisma/config";

// Prisma 7 no lee .env por su cuenta. En local se carga con el lector nativo de
// Node; en CI y en Vercel las variables ya vienen del entorno.
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables del entorno.
}

const databaseUrl = process.env.DATABASE_URL;

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
