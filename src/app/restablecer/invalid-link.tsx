import Link from "next/link";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";

/** Aviso de link vencido o ya usado, con acceso a solicitar uno nuevo (RF-11). */
export function InvalidLink() {
  return (
    <div className="grid gap-4">
      <FormAlert>El link ya no es válido. Solicita uno nuevo.</FormAlert>
      <Button asChild size="lg" className="h-11 w-full">
        <Link href="/recuperar">Solicitar un link nuevo</Link>
      </Button>
    </div>
  );
}
