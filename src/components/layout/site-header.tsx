import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Encabezado de todas las páginas. Sin sesión solo ofrece ingresar (RF-12);
 * con sesión lleva a las ligas del ayudante, a su cuenta y a cerrar sesión.
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
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-2 px-4">
        <Link href="/" className="shrink-0 text-base font-semibold">
          Liga Futsal
        </Link>
        {signedIn ? (
          <nav aria-label="Administración" className="flex items-center">
            <Button asChild variant="ghost" size="sm" className="px-1.5">
              <Link href="/mis-ligas">Mis ligas</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="px-1.5">
              <Link href="/cuenta">Cuenta</Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm" className="px-2">
                Cerrar sesión
              </Button>
            </form>
          </nav>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/ingresar">Ingresar</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
