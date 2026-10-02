import "server-only";

import { z } from "zod";

/**
 * Variables de entorno del servidor (principio 5). Cada tarea que agrega un
 * servicio suma aquí sus variables y las documenta en `.env.example`.
 */
const envSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: (issue) =>
      issue.input === undefined
        ? "falta; defínela en .env (ver .env.example)"
        : "debe ser una URL de Postgres (postgresql://...)",
  }),
  // Secreto con el que Better Auth firma sesiones y tokens (ADR 005).
  BETTER_AUTH_SECRET: z
    .string({ error: "falta; genera uno con `openssl rand -base64 32`" })
    .min(32, {
      error: "debe tener al menos 32 caracteres",
    }),
  // URL pública de la app. Obligatoria en producción; sin ella, Better Auth
  // deduce el origen de cada petición (lo que usan las URLs de prueba).
  BETTER_AUTH_URL: z.url({ error: "debe ser una URL (https://...)" }).optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Valida las variables y falla con un mensaje que nombra cada variable inválida. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variables de entorno inválidas:\n${details}`);
  }
  return result.data;
}

let cachedEnv: Env | undefined;

/** Variables del proceso validadas; se validan una sola vez. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
