import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Encabezado de todas las páginas. Sin sesión solo ofrece ingresar; ninguna
 * acción de edición aparece aquí (RF-12).
 */
export function SiteHeader({
  signedIn,
  signOutAction,
}: {
  signedIn: boolean;
  signOutAction: () => Promise<void>;
}) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-base font-semibold">
          Liga Futsal
        </Link>
        {signedIn ? (
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/ingresar">Ingresar</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
