# AGENTS.md

## Qué es este proyecto
App web para gestionar las ligas internas semestrales de futsal y fútbol de las secciones de un curso universitario. Los ayudantes (uno por sección) crean su liga, equipos, jugadores y fechas, y registran resultados y goles desde el celular en la cancha; cualquiera puede ver las tablas de posiciones y goleadores por un link público sin iniciar sesión.

## Comandos
- Ejecutar: `[pendiente de sdd-architect]`
- Tests unitarios: `[pendiente de sdd-architect]`
- Tests E2E: `[pendiente de sdd-architect]`
- Lint: `[pendiente de sdd-architect]`

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

- Estructura de carpetas, formato y gestor de paquetes: `[pendiente de sdd-architect]`.

## Límites
- No se hace push directo a `main`; todo entra por PR con CI en verde.
- No se desactivan ni se saltan tests (`.skip`, `.only`, borrarlos) para dejar el CI en verde.
- No se escribe código de producción fuera de la fase `sdd-implement`.
- No se modifican a mano archivos autogenerados (lockfiles, migraciones generadas, CHANGELOG).
- No se agrega una dependencia o servicio sin comprobar antes que su uso es gratuito y no exige tarjeta.

## Verificación obligatoria al terminar cualquier tarea
1. Tests unitarios en verde: `[pendiente de sdd-architect]`.
2. Tests E2E en verde: `[pendiente de sdd-architect]`.
3. Lint sin errores: `[pendiente de sdd-architect]`.
4. El comportamiento nuevo o cambiado coincide con la spec de `specs/` que lo origina.

Los principios del proyecto están en `docs/constitution.md`. Este archivo no los repite.
