import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Ingresar - Liga Futsal" };

export default function SignInPage() {
  return (
    <AuthCard
      title="Ingresar"
      description="Para ayudantes a cargo de una liga."
      footer={
        <>
          <p>
            <Link href="/recuperar" className="font-medium text-foreground underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-foreground underline">
              Crear cuenta
            </Link>
          </p>
        </>
      }
    >
      <SignInForm />
    </AuthCard>
  );
}
