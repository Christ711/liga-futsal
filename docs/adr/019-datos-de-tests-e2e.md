# ADR 019 - Datos de tests E2E con base reiniciada y fixtures de Prisma

Fecha: 2026-09-29   Estado: Aceptada

## Contexto
Los flujos principales llevan test E2E y ningún cambio se integra con la suite en rojo (principio 2). Los E2E corren con Playwright contra el build de producción y una base Postgres propia (ADR 013, ADR 014). Muchos tests necesitan datos previos (ligas, equipos, fechas, goles) y deben ser independientes y estables. Surgió como decisión D20 del plan 001 y aplica a todo el proyecto.

## Opciones consideradas

### Opción A - Base reiniciada por ejecución y fixtures con Prisma
Cada ejecución de E2E reinicia su base con las migraciones; cada test crea sus datos previos directamente con Prisma, con nombres y correos únicos, y usa la interfaz solo para el flujo que verifica. Gana: tests independientes, rápidos y sin datos sobrantes; un fallo en una pantalla no rompe los tests de otras. Pierde: los fixtures pueden desviarse de lo que la interfaz realmente crea si no se mantienen alineados con los casos de uso. Cambiarla: coste medio.

### Opción B - Todo por la interfaz
Cada test crea sus datos recorriendo las pantallas. Gana: prueba siempre el camino real. Pierde: tests lentos y en cadena; un fallo al crear ligas rompe todos los demás. Cambiarla: coste medio.

### Opción C - Base con datos semilla compartidos
Una semilla fija carga datos al inicio y todos los tests los usan. Gana: preparación mínima por test. Pierde: tests acoplados por datos compartidos que se modifican entre sí, fuente típica de fallos intermitentes. Cambiarla: coste medio.

## Decisión
Base reiniciada por ejecución y fixtures con Prisma por test. Da tests independientes y estables, y cada flujo sigue probado por la interfaz en su propio test.

## Consecuencias
- Los E2E y los tests de integración usan bases separadas (`liga_e2e` y `liga_integration`) para no pisarse.
- El reinicio lo hace `tests/support/reset-test-database.ts` (crea la base si falta, recrea el esquema `public` y aplica `prisma migrate deploy`) en vez de `prisma migrate reset`, que exige consentimiento manual cuando lo ejecuta un agente de IA. Decisión del autor (2026-10-01); como resguardo, solo reinicia `liga_integration` o `liga_e2e` en un host local o en CI.
- Los fixtures crean datos respetando las mismas restricciones que los casos de uso (nombres normalizados, relaciones válidas); si un caso de uso agrega una regla, el fixture se actualiza en el mismo PR.
- Cada test genera nombres y correos únicos, de modo que el orden de ejecución no importa.
- Revertir: reemplazar fixtures por pasos de interfaz o por una semilla.

## Revisar si...
- Aparece un fallo en producción que los E2E no detectaron porque un fixture creó datos que la interfaz no permite.
- La suite E2E supera 10 minutos por ejecución.
