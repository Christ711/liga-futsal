"use client";

import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Menu,
  MinusCircle,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Section = { label: string; path: string; icon: LucideIcon; inProgressOnly?: boolean };

/** Vistas de la administración de una liga (plan D22). */
const SECTIONS: Section[] = [
  { label: "Resumen", path: "", icon: LayoutDashboard },
  { label: "Equipos", path: "/equipos", icon: Shield },
  { label: "Fechas", path: "/fechas", icon: CalendarDays, inProgressOnly: true },
  { label: "Descuentos", path: "/descuentos", icon: MinusCircle, inProgressOnly: true },
  { label: "Ajustes", path: "/ajustes", icon: Settings },
];

/**
 * Menú de la liga: en el celular se abre con un botón y se superpone; en
 * pantallas anchas queda fijo a la izquierda (plan D22). Una liga finalizada ya
 * no tiene fechas ni descuentos (RF-75), así que no se ofrecen.
 */
export function LeagueNav({
  leagueId,
  leagueName,
  finalized,
}: {
  leagueId: string;
  leagueName: string;
  finalized: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/mis-ligas/${leagueId}`;
  const sections = SECTIONS.filter((section) => !(finalized && section.inProgressOnly));
  const isCurrent = (section: Section) =>
    section.path === ""
      ? pathname === base
      : pathname === base + section.path || pathname.startsWith(`${base}${section.path}/`);
  const current = sections.find(isCurrent);

  const links = (
    <nav aria-label="Secciones de la liga" className="grid gap-1">
      {sections.map((section) => (
        <Link
          key={section.label}
          href={base + section.path}
          aria-current={isCurrent(section) ? "page" : undefined}
          onClick={() => setOpen(false)}
          className={cn(
            "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            "aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground",
          )}
        >
          <section.icon aria-hidden className="size-4" />
          {section.label}
        </Link>
      ))}
      <hr className="my-2 border-border" />
      <Link
        href={`/ligas/${leagueId}`}
        onClick={() => setOpen(false)}
        className="flex h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <ExternalLink aria-hidden className="size-4" />
        Ver página pública
      </Link>
    </nav>
  );

  return (
    <>
      {/* Celular: barra con el nombre de la liga y el botón del menú. */}
      <div className="sticky top-0 z-30 border-b bg-card lg:hidden">
        <div className="mx-auto flex h-12 w-full max-w-lg items-center gap-2 px-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Menú de la liga"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{leagueName}</span>
          {current ? (
            <span className="shrink-0 pr-2 text-sm text-muted-foreground">{current.label}</span>
          ) : null}
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0 lg:hidden">
          <SheetHeader>
            <SheetTitle className="wrap-anywhere">{leagueName}</SheetTitle>
            <SheetDescription>Administración de la liga</SheetDescription>
          </SheetHeader>
          <div className="px-2">{links}</div>
        </SheetContent>
      </Sheet>

      {/* Pantallas anchas: menú fijo a la izquierda. */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 grid gap-3 pt-8">
          <p className="px-3 text-sm font-semibold wrap-anywhere">{leagueName}</p>
          {links}
        </div>
      </aside>
    </>
  );
}
