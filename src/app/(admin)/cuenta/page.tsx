import type { Metadata } from "next";

import { PageSection } from "@/components/layout/page-section";
import { requireSession } from "@/server/auth/session";
import { getAccountSummary } from "@/server/queries/account";

import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountDialog } from "./delete-account-dialog";

export const metadata: Metadata = { title: "Mi cuenta - Liga Futsal" };

export default async function AccountPage() {
  const session = await requireSession();
  const summary = await getAccountSummary(session.user.id);

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Ingresas con{" "}
          <span className="font-medium wrap-anywhere text-foreground">{summary.email}</span>
        </p>
      </div>
      <PageSection
        id="cambiar-correo"
        title="Cambiar correo"
        description="Desde ahora ingresarás con el correo nuevo. No te enviaremos un mensaje para verificarlo."
      >
        <ChangeEmailForm />
      </PageSection>
      <PageSection
        id="cambiar-contrasena"
        title="Cambiar contraseña"
        description="Tu sesión seguirá abierta aquí y se cerrará en los demás dispositivos."
      >
        <ChangePasswordForm />
      </PageSection>
      <PageSection
        id="eliminar-cuenta"
        title="Eliminar cuenta"
        description="Borra tu cuenta y todas tus ligas. No se puede deshacer."
      >
        <DeleteAccountDialog leagues={summary.leagues} />
      </PageSection>
    </main>
  );
}
