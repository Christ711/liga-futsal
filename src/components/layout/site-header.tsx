import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Botones sobre la cabecera de color: texto blanco y fondo translúcido (plan D22). */
const HEADER_LINK =
  "px-1.5 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground";
const HEADER_BUTTON =
  "border-white/40 bg-white/10 px-2 text-primary-foreground shadow-none hover:bg-white/20 hover:text-primary-foreground";

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
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" className="shrink-0 text-base font-semibold">
          Liga Futsal
        </Link>
        {signedIn ? (
          <nav aria-label="Administración" className="flex items-center">
            <Button asChild variant="ghost" size="sm" className={HEADER_LINK}>
              <Link href="/mis-ligas">Mis ligas</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className={HEADER_LINK}>
              <Link href="/cuenta">Cuenta</Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm" className={HEADER_BUTTON}>
                Cerrar sesión
              </Button>
            </form>
          </nav>
        ) : (
          <Button asChild variant="outline" size="sm" className={HEADER_BUTTON}>
            <Link href="/ingresar">Ingresar</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
