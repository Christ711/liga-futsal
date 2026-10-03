import { cn } from "@/lib/utils";

/** Colores del escudo genérico; cada equipo recibe siempre el mismo según su nombre. */
const GENERIC_COLORS = [
  "bg-blue-700",
  "bg-red-700",
  "bg-emerald-700",
  "bg-violet-700",
  "bg-amber-700",
  "bg-cyan-700",
  "bg-pink-700",
  "bg-slate-700",
];

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name.toLowerCase()) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return GENERIC_COLORS[hash % GENERIC_COLORS.length]!;
}

/**
 * Escudo de un equipo. Sin escudo subido muestra uno genérico con la inicial
 * del nombre (RF-31).
 */
export function Crest({
  teamId,
  name,
  crestHash,
  size = 40,
  className,
}: {
  teamId: string;
  name: string;
  crestHash: string | null;
  size?: number;
  className?: string;
}) {
  if (crestHash) {
    return (
      // ADR 007: el escudo ya está reducido y no pasa por la optimización de
      // imágenes de Vercel, para no gastar su cuota.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/escudos/${teamId}/${crestHash}`}
        alt={`Escudo de ${name}`}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase("es-CL") ?? "?";
  return (
    <span
      role="img"
      aria-label={`Escudo genérico de ${name}`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        colorFor(name),
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {initial}
    </span>
  );
}
