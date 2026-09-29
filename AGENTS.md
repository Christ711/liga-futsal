# AGENTS.md

## Qué es este proyecto
App web para gestionar las ligas internas semestrales de futsal y fútbol de las secciones de un curso universitario. Los ayudantes (uno por sección) crean su liga, equipos, jugadores y fechas, y registran resultados y goles desde el celular en la cancha; cualquiera puede ver las tablas de posiciones y goleadores por un link público sin iniciar sesión.

## Comandos
Gestor de paquetes: pnpm. Los scripts los crea la primera tarea de implementación con estos nombres.
- Base local: `pnpm db:up` (Postgres en Docker) y `pnpm db:migrate`
- Ejecutar: `pnpm dev`
- Tests unitarios: `pnpm test`
- Tests E2E: `pnpm test:e2e`
- Lint: `pnpm lint`
- Formato: `pnpm format` (verificar: `pnpm format:check`)
- Tipos: `pnpm typecheck`

## Estilo y convenciones
- Flujo SDD: `docs/constitution.md`, `docs/adr/NNN-slug.md`, `specs/NNN-slug/{spec,plan,tasks}.md`.
- Una rama por tarea y un PR hacia `main`; `main` es lo que se publica.
- Glosario del dominio (español en la interfaz y las specs, inglés en el código):

| Español | Código |
|---|---|
| Liga | `league` |
| Semestre | `semester` |
| Ayudante | `assistant` |
| Código de invitación | `inviteCode` |
| Equipo | `team` |
| Escudo | `crest` |
| Jugador | `player` |
| Fecha | `matchday` |
| Partido | `match` |
| Gol | `goal` |
| Gol sin autor | `goal` sin `scorerId` |
| Tabla de posiciones | `standings` |
| Goleadores | `topScorers` |
| Descuento de puntos | `pointDeduction` |
| Traspaso | `transfer` |
| Liga finalizada | `finalized` |
| Fecha incompleta | `incomplete` |

- Estructura de carpetas: la de ADR 016 (`src/domain`, `src/server`, `src/app`, `src/components`, `tests/e2e`, `prisma/`).
- Decisiones de arquitectura: `docs/adr/`; antes de cambiar algo estructural, leer la ADR correspondiente.

## Límites
- No se hace push directo a `main`; todo entra por PR con CI en verde.
- No se desactivan ni se saltan tests (`.skip`, `.only`, borrarlos) para dejar el CI en verde.
- No se escribe código de producción fuera de la fase `sdd-implement`.
- No se modifican a mano archivos autogenerados (lockfiles, migraciones generadas, CHANGELOG).
- No se agrega una dependencia o servicio sin comprobar antes que su uso es gratuito y no exige tarjeta.

## Verificación obligatoria al terminar cualquier tarea
1. `pnpm format:check`, `pnpm lint` y `pnpm typecheck` sin errores.
2. `pnpm test` en verde.
3. `pnpm test:e2e` en verde.
4. El comportamiento nuevo o cambiado coincide con la spec de `specs/` que lo origina.

Los principios del proyecto están en `docs/constitution.md`. Este archivo no los repite.
