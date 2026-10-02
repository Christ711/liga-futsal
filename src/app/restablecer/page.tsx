import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";

import { InvalidLink } from "./invalid-link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Contraseña nueva - Liga Futsal" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  // Better Auth redirige con `error` si el link venció o ya se usó (RF-11).
  const valid = typeof token === "string" && token !== "" && error === undefined;

  return (
    <AuthCard
      title="Contraseña nueva"
      description="Elige la contraseña con la que vas a ingresar desde ahora."
      footer={
        <p>
          <Link href="/ingresar" className="font-medium text-foreground underline">
            Volver a ingresar
          </Link>
        </p>
      }
    >
      {valid ? <ResetForm token={token} /> : <InvalidLink />}
    </AuthCard>
  );
}
