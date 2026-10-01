# ADR 004 - Acceso a datos y migraciones con Prisma ORM

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La base es Postgres en Neon (ADR 003), accedida desde funciones de Vercel con muchas conexiones cortas (ADR 001). Algunas operaciones deben ser atómicas: finalizar una liga guarda el snapshot y borra fechas, partidos y goles (RF-74, RF-75), eliminar una fecha recalcula tablas (RF-50) y eliminar una cuenta arrastra sus ligas (RF-92). El código es TypeScript (principio 7) y el esquema evolucionará con specs futuras.

## Opciones consideradas

### Opción A - Drizzle ORM y drizzle-kit
Esquema en TypeScript, consultas con API parecida a SQL, migraciones SQL generadas por drizzle-kit. Gana: cercano a SQL, sin generación de código, liviano, driver nativo para Neon con transacciones. Pierde: más joven, detección de desvíos entre esquema y base menos estricta, relaciones complejas más manuales. Cambiarla: coste medio.

### Opción B - Prisma ORM y prisma migrate
Esquema en `schema.prisma`, cliente tipado generado, migraciones SQL con detección de desvíos. Gana: el ORM más maduro, migraciones robustas, API cómoda para relaciones, adaptador para Neon con transacciones, el autor ya lo conoce bien. Pierde: paso `prisma generate` en build y CI, esquema en lenguaje propio, SQL crudo para consultas avanzadas. Cambiarla: coste medio.

### Opción C - Kysely con migraciones manuales
Query builder tipado sin ORM; migraciones y tipos escritos a mano. Gana: control total del SQL, pocas dependencias. Pierde: más trabajo manual y más riesgo de desincronizar tipos y base. Cambiarla: coste medio.

## Decisión
Prisma ORM con `prisma migrate`, en la última versión mayor estable (7.x a la fecha; el tag `latest` de npm apunta a una RC de la 8, que no se usa). El autor lo conoce bien, y sus migraciones con detección de desvíos son las más seguras para una app que no se vigila a diario. La conexión usa el adaptador `@prisma/adapter-pg` (driver `pg` por TCP) en todos los entornos: Postgres de Docker en local y CI (ADR 014) y la URL con pooling de Neon en producción. Se descartó el adaptador de Neon (`@prisma/adapter-neon`) porque su driver habla con Neon por WebSocket o HTTP y no se conecta a un Postgres estándar sin un proxy; usarlo solo en producción dejaría a CI probando un driver distinto del que corre en producción.

## Consecuencias
- El esquema vive en `schema.prisma` y cada cambio genera una migración SQL versionada que se revisa en el PR.
- Las migraciones generadas no se editan a mano después de aplicarse (límite de AGENTS.md sobre archivos autogenerados).
- Build y CI ejecutan `prisma generate`; producción aplica migraciones con `prisma migrate deploy`, nunca `migrate dev`.
- Las operaciones de RF-50, RF-74, RF-75 y RF-92 se ejecutan en una transacción.
- Las versiones de `prisma`, `@prisma/client` y `@prisma/adapter-pg` se fijan en la misma versión exacta.
- En producción `DATABASE_URL` apunta a la URL con pooling de Neon (host `-pooler`).
- Revertir: reescribir las consultas con otra herramienta; las tablas y los datos se mantienen.

## Revisar si...
- La medición de RNF-2 muestra que abrir conexiones TCP desde las funciones de Vercel es el cuello de botella (entonces se evalúa el adaptador de Neon con un proxy en local y CI).
- Una versión mayor de Prisma obliga a una migración que cuesta más que cambiar de herramienta.
- El tamaño del cliente de Prisma impide cumplir RNF-2.
