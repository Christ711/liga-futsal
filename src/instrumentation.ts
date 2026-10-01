// Next.js ejecuta `register` una vez al arrancar el servidor: si falta una
// variable de entorno, la app no arranca en vez de fallar en la primera consulta.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/server/env");
    getEnv();
  }
}
