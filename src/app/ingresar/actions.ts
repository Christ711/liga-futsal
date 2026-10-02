"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages } from "@/domain/result";
import { signIn } from "@/server/use-cases/sign-in";
import { signOut } from "@/server/use-cases/sign-out";

import type { FormState } from "../form-state";

const schema = z.object({
  email: z.string(),
  password: z.string(),
});

export async function signInAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT }, values: {} };
  }

  const result = await signIn(parsed.data, await headers());
  if (!result.ok) {
    return { error: result.error, values: { email: parsed.data.email } };
  }
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await signOut(await headers());
  redirect("/");
}
