"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages } from "@/domain/result";
import { register } from "@/server/use-cases/register";

import type { FormState } from "../form-state";

const schema = z.object({
  email: z.string(),
  password: z.string(),
  inviteCode: z.string(),
});

export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT }, values: {} };
  }

  const result = await register(parsed.data, await headers());
  if (!result.ok) {
    return {
      error: result.error,
      values: { email: parsed.data.email, inviteCode: parsed.data.inviteCode },
    };
  }
  redirect("/");
}
