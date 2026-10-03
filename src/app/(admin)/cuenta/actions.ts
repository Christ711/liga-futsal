"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessages, type AppError } from "@/domain/result";
import { changeEmail } from "@/server/use-cases/change-email";
import { changePassword } from "@/server/use-cases/change-password";
import { deleteAccount } from "@/server/use-cases/delete-account";

/** Resultado de un formulario de la cuenta: rechazo con su error, o éxito con su aviso. */
export type AccountFormState =
  | { ok: false; error: AppError; values: Record<string, string> }
  | { ok: true; notice: string }
  | null;

const invalidInput = (): AccountFormState => ({
  ok: false,
  error: { code: "INVALID_INPUT", message: errorMessages.INVALID_INPUT },
  values: {},
});

const passwordSchema = z.object({ currentPassword: z.string(), newPassword: z.string() });

export async function changePasswordAction(
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();

  const result = await changePassword(parsed.data, await headers());
  if (!result.ok) return { ok: false, error: result.error, values: {} };
  return {
    ok: true,
    notice: "Contraseña actualizada. Cerramos tu sesión en los demás dispositivos.",
  };
}

const emailSchema = z.object({ email: z.string(), currentPassword: z.string() });

export async function changeEmailAction(
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidInput();

  const result = await changeEmail(parsed.data, await headers());
  if (!result.ok) return { ok: false, error: result.error, values: { email: parsed.data.email } };
  // La página muestra el correo de la cuenta; se vuelve a renderizar con el nuevo.
  revalidatePath("/cuenta");
  return { ok: true, notice: "Correo actualizado." };
}

export async function deleteAccountAction(): Promise<AccountFormState> {
  const result = await deleteAccount(await headers());
  if (!result.ok) return { ok: false, error: result.error, values: {} };
  redirect("/");
}
