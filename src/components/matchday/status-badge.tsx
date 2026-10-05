import type { MatchdayStatus } from "@/domain/matchdays";
import { cn } from "@/lib/utils";

const BADGE = "rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const MATCHDAY_STYLES: Record<MatchdayStatus, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-800",
  incomplete: "border-amber-200 bg-amber-50 text-amber-800",
  finalized: "border-border bg-muted text-muted-foreground",
};

/** Estado de una fecha: abierta, incompleta con sus pendientes, o finalizada (RF-48, RF-104, RF-105). */
export function MatchdayStatusBadge({
  status,
  pendingCount,
}: {
  status: MatchdayStatus;
  pendingCount: number;
}) {
  const label =
    status === "open"
      ? "Abierta"
      : status === "incomplete"
        ? `Incompleta (${pendingCount})`
        : "Finalizada";
  return <span className={cn(BADGE, MATCHDAY_STYLES[status])}>{label}</span>;
}

/** Estado de un partido: pendiente, terminado o bloqueado (RF-52, RF-103). */
export function MatchStatusBadge({
  status,
  locked,
}: {
  status: "pending" | "finished";
  locked: boolean;
}) {
  if (status === "pending") {
    return <span className={cn(BADGE, "border-border bg-background")}>Pendiente</span>;
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn(BADGE, "border-emerald-200 bg-emerald-50 text-emerald-800")}>
        Terminado
      </span>
      {locked ? (
        <span className={cn(BADGE, "border-border bg-muted text-muted-foreground")}>Bloqueado</span>
      ) : null}
    </span>
  );
}
