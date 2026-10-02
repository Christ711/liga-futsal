import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta - Liga Futsal" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crear cuenta"
      description="Para ayudantes. Necesitas el código de invitación."
      footer={
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link href="/ingresar" className="font-medium text-foreground underline">
            Ingresar
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
