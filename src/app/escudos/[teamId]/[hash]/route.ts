import { getCrest } from "@/server/queries/crest";

/**
 * Sirve el escudo de un equipo (ADR 007). La URL lleva el hash del contenido,
 * así que puede guardarse en caché para siempre: un escudo nuevo tiene otra URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string; hash: string }> },
) {
  const { teamId, hash } = await params;
  const data = await getCrest(teamId, hash);
  if (!data) return new Response("Escudo no encontrado", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
