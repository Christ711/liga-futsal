"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages } from "@/domain/result";
import { resetPassword } from "@/server/use-cases/reset-password";

import type { FormState } from "../form-state";

const schema = z.object({
  token: z.string(),
  newPassword: z.string(),
});

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT }, values: {} };
  }

  const result = await resetPassword(parsed.data, await headers());
  if (!result.ok) return { error: result.error, values: {} };
  redirect("/ingresar?restablecida=1");
}
