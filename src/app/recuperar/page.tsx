import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";

import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña - Liga Futsal" };

export default function RecoverPage() {
  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Te enviamos un link a tu correo para elegir una contraseña nueva."
      footer={
        <p>
          <Link href="/ingresar" className="font-medium text-foreground underline">
            Volver a ingresar
          </Link>
        </p>
      }
    >
      <RecoverForm />
    </AuthCard>
  );
}
