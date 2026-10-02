import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/server/db/client";
import { getEnv } from "@/server/env";

import { assertInviteCode } from "./invite-code-hook";
import { assertNotLockedOut, recordFailedSignIn } from "./login-lockout-hooks";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

const env = getEnv();

/** Autenticación de ayudantes con correo y contraseña (ADR 005). */
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // RF-5: la cuenta se activa sin verificar el correo.
    requireEmailVerification: false,
  },
  session: {
    // RF-6: 30 días desde el inicio de sesión, sin renovación automática.
    expiresIn: THIRTY_DAYS_IN_SECONDS,
    disableSessionRefresh: true,
  },
  // Plan D10: el limitador de Better Auth es por IP y en memoria; el bloqueo
  // por correo de RF-7 se implementa con hooks propios.
  rateLimit: { enabled: false },
  // Plan D11: no se guardan IP ni user agent de las sesiones (principio 4).
  advanced: { ipAddress: { disableIpTracking: true } },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") assertInviteCode(ctx.body);
      if (ctx.path === "/sign-in/email") await assertNotLockedOut(ctx.body);
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") await recordFailedSignIn(ctx.body, ctx.context.returned);
    }),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => ({
          data: { ...session, ipAddress: null, userAgent: null },
        }),
      },
    },
  },
  // Debe ir al final: deja que las Server Actions escriban la cookie de sesión.
  plugins: [nextCookies()],
});
