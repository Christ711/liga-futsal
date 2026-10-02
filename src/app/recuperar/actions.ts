"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { requestPasswordReset } from "@/server/use-cases/request-password-reset";

const schema = z.object({ email: z.string() });

export type RecoverState = { sent: true } | null;

export async function requestPasswordResetAction(
  _previous: RecoverState,
  formData: FormData,
): Promise<RecoverState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    await requestPasswordReset(parsed.data.email, await headers());
  }
  // RF-9: la respuesta es la misma exista o no una cuenta con ese correo.
  return { sent: true };
}
