import "server-only";

import { after } from "next/server";

/**
 * Ejecuta un envío después de responder la petición. Así la respuesta tarda lo
 * mismo exista o no la cuenta (RF-9), y en Vercel el envío termina aunque la
 * respuesta ya haya salido. Si falla, el error queda en los logs del servidor
 * y el usuario igual ve el mensaje neutro (ADR 006).
 */
export async function deliverInBackground(description: string, send: () => Promise<void>) {
  const run = async () => {
    try {
      await send();
    } catch (error) {
      console.error(`No se pudo enviar el correo (${description}):`, error);
    }
  };
  try {
    after(run);
  } catch {
    // Fuera de una petición de Next.js (tests de integración) no existe `after`.
    await run();
  }
}
