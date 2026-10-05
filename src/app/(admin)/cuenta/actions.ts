"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages, type Result } from "@/domain/result";
import { changePassword } from "@/server/use-cases/change-password";
import { deleteAccount } from "@/server/use-cases/delete-account";

import type { NoticeFormState } from "../../form-state";

const invalidInput = (): NoticeFormState => ({
  ok: false,
  error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT },
  values: {},
});

const passwordSchema = z.object({ currentPassword: z.string(), newPassword: z.string() });

export async function changePasswordAction(
  _previous: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();

  const result = await changePassword(parsed.data, await headers());
  if (!result.ok) return { ok: false, error: result.error, values: {} };
  return {
    ok: true,
    notice: "Contraseña actualizada. Cerramos tu sesión en los demás dispositivos.",
  };
}

export async function deleteAccountAction(): Promise<Result<never>> {
  const result = await deleteAccount(await headers());
  if (!result.ok) return result;
  redirect("/");
}
