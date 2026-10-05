import "server-only";

import { z } from "zod";

/**
 * Variables de entorno del servidor (principio 5). Cada tarea que agrega un
 * servicio suma aquí sus variables y las documenta en `.env.example`.
 */
const envSchema = z
  .object({
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
    // Código que el profesor entrega a los ayudantes para registrarse (RF-2).
    INVITE_CODE: z.string({ error: "falta; define el código de invitación" }).min(8, {
      error: "debe tener al menos 8 caracteres",
    }),
    // URL pública de la app. Obligatoria en producción; sin ella, Better Auth
    // deduce el origen de cada petición (lo que usan las URLs de prueba).
    BETTER_AUTH_URL: z.url({ error: "debe ser una URL (https://...)" }).optional(),
    // Servidor SMTP para el correo de recuperación (ADR 006): Gmail en Vercel,
    // Mailpit en local y CI.
    SMTP_HOST: z.string({ error: "falta; por ejemplo smtp.gmail.com" }).min(1, { error: "falta" }),
    SMTP_PORT: z.coerce
      .number({ error: "falta; por ejemplo 465" })
      .int()
      .positive({ error: "debe ser un puerto válido" }),
    // Usuario y contraseña SMTP. Mailpit no los pide, así que son opcionales,
    // pero deben venir los dos o ninguno.
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    // Remitente de los correos, por ejemplo "Liga Futsal <cuenta@gmail.com>".
    MAIL_FROM: z.string({ error: "falta; el remitente de los correos" }).min(3, { error: "falta" }),
    // Correos de las cuentas administradoras, separados por coma (RF-112, plan D21).
    // Opcional: sin ella no hay administradores.
    ADMIN_EMAILS: z
      .string()
      .optional()
      .transform((value) =>
        (value ?? "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email !== ""),
      )
      .pipe(z.array(z.email({ error: "debe ser una lista de correos separados por coma" }))),
  })
  .refine((env) => Boolean(env.SMTP_USER) === Boolean(env.SMTP_PASSWORD), {
    path: ["SMTP_PASSWORD"],
    error: "SMTP_USER y SMTP_PASSWORD deben definirse juntos",
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
