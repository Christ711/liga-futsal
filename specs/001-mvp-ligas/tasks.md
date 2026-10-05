# Tareas 001 - MVP de ligas internas

Toda tarea, además de su criterio "Hecho cuando", termina con la verificación obligatoria de `AGENTS.md` en verde (formato, lint, tipos, unitarios y E2E). Las tareas marcadas "(manual, autor)" las hace el autor fuera del código; `sdd-implement` no las ejecuta. Las marcadas `[SIN RF]` no cubren un RF de la spec: habilitan la infraestructura que exigen la constitución o una ADR, indicada entre paréntesis.

## Fase 0 - Base del proyecto

- [x] T1 - Inicializar la app Next.js con TypeScript, pnpm y versiones fijas
      RF: [SIN RF] (ADR 002, ADR 016)
      Archivos: package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, .nvmrc, src/app/layout.tsx, src/app/page.tsx
      Hecho cuando: `pnpm build` y `pnpm typecheck` pasan y `package.json` fija `packageManager` (pnpm 10) y `engines.node` (24.x, la LTS que soporta Vercel).

- [x] T2 - Configurar ESLint y Prettier con los scripts `lint`, `format` y `format:check`
      RF: [SIN RF] (ADR 013)
      Archivos: eslint.config.mjs, .prettierrc, .prettierignore, package.json
      Hecho cuando: los tres scripts corren sin errores sobre el proyecto.

- [x] T3 - Agregar las reglas de lint de frontera de imports
      RF: [SIN RF] (principio 8, ADR 016)
      Archivos: eslint.config.mjs
      Hecho cuando: un import temporal de `@prisma/client` en `src/domain` hace fallar `pnpm lint` y, sin él, `pnpm lint` pasa.

- [x] T4 - Configurar Vitest y crear `domain/result` con el catálogo de errores
      RF: [SIN RF] (ADR 010, ADR 013)
      Archivos: vitest.config.ts, src/domain/result.ts, src/domain/result.test.ts, package.json
      Hecho cuando: `pnpm test` ejecuta en verde el test que construye un `ok` y un rechazo con `code` y `message` en español.

- [x] T5 - Configurar Tailwind v4, shadcn/ui y el layout raíz en español
      RF: [SIN RF] (ADR 012, principio 6)
      Archivos: src/app/globals.css, components.json, src/lib/utils.ts, src/components/ui/button.tsx, src/app/layout.tsx
      Hecho cuando: la página de inicio muestra un `Button` de shadcn con estilos y el `<html>` tiene `lang="es-CL"`.

- [x] T6 - Crear el `docker-compose.yml` con Postgres 17 y Mailpit y el script `db:up`
      RF: [SIN RF] (ADR 014, ADR 018)
      Archivos: docker-compose.yml, package.json
      Hecho cuando: `pnpm db:up` deja Postgres escuchando en el puerto 5433 (5432 lo usan otros proyectos del autor) y la interfaz de Mailpit en el 8025.

- [x] T7 - Instalar Prisma 7 con el adaptador `pg` y crear el cliente en `server/db`
      RF: [SIN RF] (ADR 004)
      Archivos: prisma/schema.prisma, prisma.config.ts, src/server/db/client.ts, package.json
      Hecho cuando: `pnpm prisma validate` pasa, el cliente se genera y `pnpm typecheck` pasa importándolo.

- [x] T8 - Validar las variables de entorno con Zod y crear `.env.example`
      RF: [SIN RF] (principio 5)
      Archivos: src/server/env.ts, .env.example, .gitignore
      Hecho cuando: arrancar sin `DATABASE_URL` falla con un mensaje que nombra la variable, y `git check-ignore .env` confirma que `.env` está ignorado.

- [x] T9 - Crear el módulo de tiempo con "hoy" y "ahora" en America/Santiago
      RF: [SIN RF] (ADR 015; lo usan RF-17, RF-94 y RF-97)
      Archivos: src/server/time.ts, src/server/time.test.ts
      Hecho cuando: con el reloj fijado en 2026-01-01T02:00Z el test obtiene "2025-12-31", y con 2026-08-01T03:30Z obtiene "2026-07-31".

- [x] T10 - Configurar tests de integración de Vitest contra el Postgres local
      RF: [SIN RF] (ADR 013, ADR 014)
      Archivos: vitest.config.ts, tests/integration/setup.ts, package.json
      Hecho cuando: `pnpm test:integration` reinicia su propia base (`liga_integration`, separada de la de E2E) con las migraciones y ejecuta en verde un test que consulta `SELECT 1` con el cliente de Prisma.

- [x] T11 - Configurar Playwright a 360 px contra el build de producción, con reinicio de base
      RF: [SIN RF] (ADR 013, ADR 019)
      Archivos: playwright.config.ts, tests/e2e/global-setup.ts, tests/e2e/smoke.spec.ts, package.json
      Hecho cuando: `pnpm test:e2e` construye la app, reinicia su propia base (`liga_e2e`) y abre `/` a 360 px en verde.

- [x] T12 - Crear el workflow de CI de ADR 014
      RF: [SIN RF] (principio 2, ADR 014)
      Archivos: .github/workflows/ci.yml
      Hecho cuando: un PR ejecuta en GitHub Actions instalación, generación de Prisma, formato, lint, tipos, unitarios, integración, build y E2E con servicios Postgres 17 y Mailpit, todo en verde.

- [x] T13 - (manual, autor) Proteger `main` en GitHub exigiendo el job de CI
      RF: [SIN RF] (principio 2, ADR 014)
      Archivos: ninguno (configuración del repositorio)
      Hecho cuando: GitHub bloquea el merge de un PR con CI en rojo y rechaza un push directo a `main`.

- [x] T14 - (manual, autor) Crear el proyecto de Neon en `aws-sa-east-1` y la rama `preview` vacía
      RF: [SIN RF] (ADR 003, ADR 014, ADR 017)
      Archivos: ninguno
      Hecho cuando: el autor tiene las URLs de conexión de la rama principal y de `preview`, y `preview` no es copia de datos de producción.

- [x] T15 - (manual, autor) Crear la cuenta de Gmail dedicada con verificación en dos pasos y contraseña de aplicación
      RF: [SIN RF] (ADR 006)
      Archivos: ninguno
      Hecho cuando: el autor tiene usuario y contraseña de aplicación SMTP guardados fuera del repositorio.

- [x] T16 - Configurar `vercel.json` con la región `gru1` y el build con `prisma migrate deploy`
      RF: [SIN RF] (ADR 001, ADR 014, ADR 017)
      Archivos: vercel.json, package.json
      Hecho cuando: `vercel.json` declara `regions: ["gru1"]` y el script `vercel-build` ejecuta `prisma migrate deploy` antes de `next build` contra la base local sin errores.

- [x] T17 - (manual, autor) Crear el proyecto de Vercel con variables de entorno por entorno y URLs de prueba protegidas
      RF: [SIN RF] (ADR 001, ADR 014, principio 5)
      Archivos: ninguno
      Hecho cuando: un merge a `main` publica en producción, un PR obtiene URL de prueba protegida con la autenticación de Vercel, y producción y `preview` usan cada una su `DATABASE_URL`.

## Fase 1 - Dominio

- [x] T18 - Normalizar y validar nombres de liga, equipo y jugador
      RF: RF-19, RF-27, RF-36
      Archivos: src/domain/names.ts, src/domain/names.test.ts
      Hecho cuando: los tests aceptan 60/30/40 caracteres, rechazan 61/31/41, vacío y solo espacios, y " Tigres " y "tigres" producen la misma `nameKey`.

- [x] T19 - Validar el formato de semestre y calcular el semestre de un día
      RF: RF-16, RF-17
      Archivos: src/domain/semester.ts, src/domain/semester.test.ts
      Hecho cuando: "2026-1" es válido, "2026-3" y "26-1" no, 2026-07-31 da "2026-1" y 2026-08-01 da "2026-2".

- [x] T20 - Determinar si el semestre de una liga ya terminó
      RF: RF-94
      Archivos: src/domain/semester.ts, src/domain/semester.test.ts
      Hecho cuando: "2026-1" está terminado el 2026-08-01 y no el 2026-07-31, y "2026-2" está terminado el 2027-01-01.

- [x] T21 - Calcular el marcador de un partido desde sus goles
      RF: RF-47, RF-55, RF-56
      Archivos: src/domain/matches.ts, src/domain/matches.test.ts
      Hecho cuando: un partido con 2 goles de A (uno sin autor) y 1 de B da 2-1, y el modelo no expone local ni visita.

- [x] T22 - Validar las transiciones de un partido y el bloqueo
      RF: RF-57, RF-58, RF-84, RF-103
      Archivos: src/domain/matches.ts, src/domain/matches.test.ts
      Hecho cuando: los tests permiten terminar en 0-0, devolver a pendiente y agregar, quitar o reasignar goles en un partido no bloqueado, y rechazan cada una con `MATCH_LOCKED` si está bloqueado.

- [x] T23 - Numerar las fechas por orden cronológico
      RF: RF-43
      Archivos: src/domain/matchdays.ts, src/domain/matchdays.test.ts
      Hecho cuando: el escenario de la spec (borrar 17/09 y crear 20/09) numera 10/09, 20/09 y 24/09 como 1, 2 y 3.

- [x] T24 - Derivar el estado de una fecha y permitir jugar pendientes de fechas incompletas
      RF: RF-48, RF-49, RF-104, RF-105
      Archivos: src/domain/matchdays.ts, src/domain/matchdays.test.ts
      Hecho cuando: los tests distinguen abierta, incompleta con su cantidad de pendientes y finalizada, y un partido pendiente de una fecha incompleta admite goles.

- [x] T25 - Calcular qué partidos se bloquean al finalizar una fecha
      RF: RF-102
      Archivos: src/domain/matchdays.ts, src/domain/matchdays.test.ts
      Hecho cuando: con 4 terminados y 2 pendientes se bloquean solo los 4, y al refinalizar tras terminar los 2 se bloquean esos 2.

- [x] T26 - Generar los pares todos contra todos de una fecha
      RF: RF-42
      Archivos: src/domain/scheduling.ts, src/domain/scheduling.test.ts
      Hecho cuando: para 3 a 8 equipos se generan n(n-1)/2 pares, cada par exactamente una vez.

- [ ] ~~T27 - Ordenar los partidos sin que un equipo juegue dos seguidos~~ [OBSOLETA] (reemplazada por T87: con 4 equipos no existe un orden sin consecutivos)
      RF: RF-44
      Archivos: src/domain/scheduling.ts, src/domain/scheduling.test.ts
      Hecho cuando: con 4 a 8 equipos y 100 semillas ningún orden tiene consecutivos, y con 3 equipos se devuelve un orden igualmente.

- [x] T28 - Evitar que el primer partido repita el par que abrió la fecha anterior
      RF: RF-45
      Archivos: src/domain/scheduling.ts, src/domain/scheduling.test.ts
      Hecho cuando: los dos escenarios de la spec pasan con 100 semillas y, sin fecha anterior, no se aplica la restricción.

- [x] T29 - Calcular la tabla de posiciones básica con puntos 3-1-0
      RF: RF-59, RF-62, RF-63
      Archivos: src/domain/standings.ts, src/domain/standings.test.ts
      Hecho cuando: los tests obtienen PJ, PG, PE, PP, GF, GC, DG y Pts correctos e ignoran los partidos pendientes.

- [x] T30 - Aplicar los descuentos de puntos a la tabla
      RF: RF-64, RF-69, RF-70
      Archivos: src/domain/standings.ts, src/domain/standings.test.ts
      Hecho cuando: dos descuentos se suman, los puntos pueden quedar negativos y cada fila expone sus descuentos con motivo y cantidad.

- [x] T31 - Ordenar la tabla y resolver los desempates
      RF: RF-65, RF-66, RF-107
      Archivos: src/domain/standings.ts, src/domain/standings.test.ts
      Hecho cuando: pasan los tres escenarios de desempate de la spec y los casos de desempate por DG y por GF.

- [x] T32 - Calcular la tabla de goleadores
      RF: RF-40, RF-56, RF-71, RF-72
      Archivos: src/domain/standings.ts, src/domain/standings.test.ts
      Hecho cuando: los goles sin autor no suman, los empatados comparten posición y cada goleador aparece con su equipo actual aunque sus goles sean de otro.

- [x] T33 - Implementar las reglas de permisos de la liga
      RF: RF-23, RF-24, RF-37, RF-41, RF-76, RF-100
      Archivos: src/domain/league-rules.ts, src/domain/league-rules.test.ts
      Hecho cuando: cada regla tiene un test que la permite y otro que la rechaza con su `code`.

- [x] T34 - Decidir el bloqueo por intentos fallidos
      RF: RF-7
      Archivos: src/domain/login-lockout.ts, src/domain/login-lockout.test.ts
      Hecho cuando: 4 fallos en 15 minutos no bloquean, 5 sí, y el bloqueo termina 15 minutos después del quinto fallo.

## Fase 2 - Modelo de datos y autenticación

- [x] T35 - Configurar Better Auth con Prisma y montar `/api/auth`
      RF: RF-5, RF-6
      Archivos: src/server/auth/auth.ts, src/app/api/auth/[...all]/route.ts, prisma/schema.prisma, prisma/migrations/
      Hecho cuando: un test de integración crea un usuario con `auth.api` sin verificar correo, con `name` vacío, y su sesión vence a 30 días sin IP ni user agent.

- [x] T36 - Crear el esquema de ligas, equipos, escudos y jugadores
      RF: RF-18, RF-21, RF-26, RF-35
      Archivos: prisma/schema.prisma, prisma/migrations/, tests/integration/schema-leagues.test.ts
      Hecho cuando: la migración se aplica y los tests muestran que un segundo registro con la misma `nameKey` en el mismo ámbito falla.

- [x] T37 - Crear el esquema de fechas, partidos, goles, descuentos, snapshot e intentos fallidos
      RF: RF-37, RF-40, RF-99
      Archivos: prisma/schema.prisma, prisma/migrations/, tests/integration/schema-matchdays.test.ts
      Hecho cuando: la migración se aplica, borrar un jugador con goles falla por clave foránea y dos fechas con el mismo día en una liga fallan.

- [x] T38 - Exigir el código de invitación en el registro
      RF: RF-2
      Archivos: src/server/auth/invite-code-hook.ts, src/server/auth/auth.ts, tests/integration/invite-code.test.ts
      Hecho cuando: el registro con `auth.api` sin código o con código incorrecto se rechaza y con el código correcto se acepta.

- [x] T39 - Crear la página y la Server Action de registro
      RF: RF-1, RF-2, RF-3, RF-4, RF-5
      Archivos: src/app/registro/page.tsx, src/app/registro/actions.ts, src/server/use-cases/register.ts, tests/e2e/register.spec.ts
      Hecho cuando: el E2E registra e inicia sesión con código correcto, muestra "Código de invitación incorrecto", ofrece recuperar ante correo repetido, rechaza contraseñas de 7 caracteres, y un POST directo a `/api/auth/sign-up/email` sin código se rechaza.

- [x] T40 - Crear el inicio y el cierre de sesión
      RF: RF-6, RF-8
      Archivos: src/app/ingresar/page.tsx, src/app/ingresar/actions.ts, src/server/use-cases/sign-in.ts, src/server/use-cases/sign-out.ts, src/server/auth/session.ts, tests/e2e/sign-in.spec.ts
      Hecho cuando: el E2E inicia sesión, la cookie de sesión dura 30 días, y tras cerrar sesión la cookie desaparece y la sesión ya no existe en la base.

- [x] T41 - Bloquear el inicio de sesión tras 5 intentos fallidos
      RF: RF-7
      Archivos: src/server/auth/login-lockout-hooks.ts, src/server/auth/auth.ts, tests/e2e/login-lockout.spec.ts
      Hecho cuando: el E2E falla 5 veces y el sexto intento con la contraseña correcta se rechaza con el mensaje de bloqueo.

- [x] T42 - Crear el módulo de correo SMTP y el helper de Mailpit para E2E
      RF: RF-10
      Archivos: src/server/email/send.ts, src/server/email/templates/password-reset.ts, tests/e2e/helpers/mailpit.ts, tests/integration/email.test.ts
      Hecho cuando: un test de integración envía el correo de recuperación y el helper lo lee desde Mailpit con su link.

- [x] T43 - Crear la solicitud de recuperación de contraseña
      RF: RF-9, RF-10
      Archivos: src/app/recuperar/page.tsx, src/app/recuperar/actions.ts, src/server/use-cases/request-password-reset.ts, tests/e2e/password-reset.spec.ts
      Hecho cuando: el E2E ve "Si el correo existe, te enviamos un link" con correo existente e inexistente, y solo el existente recibe correo en Mailpit.

- [x] T44 - Crear el restablecimiento de contraseña
      RF: RF-4, RF-11, RF-86
      Archivos: src/app/restablecer/page.tsx, src/app/restablecer/actions.ts, src/server/use-cases/reset-password.ts, tests/e2e/password-reset.spec.ts
      Hecho cuando: el E2E restablece con el link, una segunda sesión abierta queda cerrada, reutilizar el link se rechaza, y un link cuyo vencimiento se fija en el pasado directamente en la base se rechaza.

- [x] T45 - Crear `requireOwnedLeague` para autorizar por dueño y estado
      RF: RF-13, RF-76
      Archivos: src/server/authz.ts, tests/integration/authz.test.ts
      Hecho cuando: los tests devuelven la liga al dueño, `FORBIDDEN` a otro ayudante, `NOT_FOUND` a una liga inexistente y `LEAGUE_FINALIZED` si se exige liga en curso.

- [x] T46 - Crear el cambio de contraseña en `/cuenta`
      RF: RF-4, RF-89, RF-90
      Archivos: src/app/(admin)/cuenta/page.tsx, src/app/(admin)/cuenta/actions.ts, src/server/use-cases/change-password.ts, tests/e2e/account.spec.ts
      Hecho cuando: el E2E cambia la contraseña con la actual correcta y cierra la sesión del otro contexto, y con la actual incorrecta se rechaza.

- [ ] ~~T47 - Crear el cambio de correo en `/cuenta`~~ [OBSOLETA] (se quita en T91: RF-87 y RF-88 eliminados)
      RF: RF-87, RF-88, RF-90
      Archivos: src/app/(admin)/cuenta/actions.ts, src/server/use-cases/change-email.ts, tests/e2e/account.spec.ts
      Hecho cuando: el E2E cambia el correo sin recibir mensaje en Mailpit, se rechaza con contraseña incorrecta y con un correo que ya usa otra cuenta.

- [x] T48 - Crear la eliminación de cuenta
      RF: RF-91, RF-92
      Archivos: src/app/(admin)/cuenta/actions.ts, src/server/use-cases/delete-account.ts, src/server/queries/account.ts, tests/e2e/account.spec.ts
      Hecho cuando: el diálogo indica la cantidad de ligas, y tras confirmar la cuenta, sus ligas y escudos ya no existen y la sesión quedó cerrada.

## Fase 3 - Ligas, equipos, jugadores y descuentos

- [x] T49 - Crear el layout autenticado con proveedor de TanStack Query y cabecera
      RF: RF-12
      Archivos: src/app/(admin)/layout.tsx, src/components/providers/query-provider.tsx, src/components/layout/admin-header.tsx
      Hecho cuando: sin sesión, cualquier ruta de `(admin)` redirige a `/ingresar`, y con sesión la cabecera muestra "Mis ligas", "Cuenta" y "Cerrar sesión".

- [x] T50 - Crear la lista "Mis ligas" con el aviso de semestre terminado
      RF: RF-21, RF-22, RF-94
      Archivos: src/app/(admin)/mis-ligas/page.tsx, src/server/queries/my-leagues.ts, tests/e2e/my-leagues.spec.ts
      Hecho cuando: el E2E ve sus ligas separadas en curso y finalizadas, y una liga en curso de un semestre anterior al actual muestra "El semestre terminó" mientras una del semestre actual no.

- [x] T51 - Crear una liga
      RF: RF-15, RF-16, RF-17, RF-18, RF-19
      Archivos: src/app/(admin)/mis-ligas/nueva/page.tsx, src/app/(admin)/mis-ligas/nueva/actions.ts, src/server/use-cases/create-league.ts, tests/e2e/leagues.spec.ts
      Hecho cuando: el formulario sugiere el semestre actual, crea la liga en curso y rechaza nombre duplicado en el mismo semestre, nombre de 61 caracteres y semestre inválido.

- [x] T52 - Crear la página de administración de la liga y redirigir al que no es dueño
      RF: RF-93
      Archivos: src/app/(admin)/mis-ligas/[leagueId]/layout.tsx, src/app/(admin)/mis-ligas/[leagueId]/page.tsx, src/server/queries/league-admin.ts, tests/e2e/leagues.spec.ts
      Hecho cuando: el dueño ve la página de administración y otro ayudante con sesión es redirigido a `/ligas/[leagueId]`.

- [x] T53 - Editar el nombre y el semestre de una liga
      RF: RF-18, RF-20
      Archivos: src/app/(admin)/mis-ligas/[leagueId]/actions.ts, src/server/use-cases/update-league.ts, tests/e2e/leagues.spec.ts
      Hecho cuando: el E2E edita nombre y semestre, y la edición a un nombre existente del mismo semestre se rechaza.

- [x] T54 - Eliminar una liga con confirmación
      RF: RF-78, RF-79
      Archivos: src/app/(admin)/mis-ligas/[leagueId]/actions.ts, src/server/use-cases/delete-league.ts, src/components/ui/alert-dialog.tsx, tests/e2e/leagues.spec.ts
      Hecho cuando: el diálogo advierte el borrado total, y tras confirmar la liga, sus equipos y escudos ya no existen.

- [x] T55 - Agregar y eliminar equipos antes de la primera fecha
      RF: RF-23, RF-24, RF-26, RF-27, RF-95, RF-96
      Archivos: src/server/use-cases/create-team.ts, src/server/use-cases/delete-team.ts, src/app/(admin)/mis-ligas/[leagueId]/team-actions.ts, src/components/league/teams-section.tsx, tests/e2e/teams.spec.ts
      Hecho cuando: el E2E agrega equipos, rechaza duplicado y 31 caracteres, elimina uno con diálogo que cuenta sus jugadores, y con una fecha existente ya no ofrece agregar ni eliminar.

- [x] T56 - Editar el nombre de un equipo
      RF: RF-25, RF-26
      Archivos: src/server/use-cases/update-team.ts, src/app/(admin)/mis-ligas/[leagueId]/team-actions.ts, tests/e2e/teams.spec.ts
      Hecho cuando: el E2E renombra un equipo y el cambio a un nombre existente de la liga se rechaza.

- [x] T57 - Validar y procesar escudos en el servidor
      RF: RF-28, RF-29, RF-30
      Archivos: src/server/crests/process.ts, tests/integration/crests.test.ts, tests/fixtures/crests/
      Hecho cuando: PNG, JPG y WebP válidos salen como WebP de máximo 256 px con proporción conservada, y SVG, un texto renombrado a `.png` y un archivo de más de 2 MB se rechazan.

- [x] T58 - Subir, reemplazar y quitar escudos, servirlos y mostrar el genérico
      RF: RF-25, RF-31, RF-32
      Archivos: src/server/use-cases/set-team-crest.ts, src/server/use-cases/remove-team-crest.ts, src/app/escudos/[teamId]/[hash]/route.ts, src/components/crest/crest.tsx, next.config.ts, tests/e2e/crests.spec.ts
      Hecho cuando: el E2E sube un escudo de 1,9 MB, lo ve servido con caché permanente, lo reemplaza con otra URL, lo quita y ve el escudo genérico con la inicial.

- [x] T59 - Agregar y editar jugadores
      RF: RF-33, RF-34, RF-35, RF-36
      Archivos: src/server/use-cases/create-player.ts, src/server/use-cases/update-player.ts, src/app/(admin)/mis-ligas/[leagueId]/player-actions.ts, src/components/league/players-section.tsx, tests/e2e/players.spec.ts
      Hecho cuando: el E2E agrega y renombra jugadores y rechaza un nombre repetido en otro equipo de la liga y uno de 41 caracteres.

- [x] T60 - Eliminar jugadores sin goles
      RF: RF-37, RF-38
      Archivos: src/server/use-cases/delete-player.ts, src/app/(admin)/mis-ligas/[leagueId]/player-actions.ts, tests/e2e/players.spec.ts
      Hecho cuando: el E2E elimina un jugador sin goles y, para uno con goles, ve el rechazo que sugiere editar el nombre.

- [x] T61 - Traspasar jugadores entre equipos
      RF: RF-39, RF-40
      Archivos: src/server/use-cases/transfer-player.ts, src/app/(admin)/mis-ligas/[leagueId]/player-actions.ts, tests/integration/transfer-player.test.ts
      Hecho cuando: tras el traspaso el jugador pertenece al nuevo equipo, sus goles siguen siendo suyos y el marcador del partido anterior no cambia.

- [x] T62 - Aplicar, editar y eliminar descuentos de puntos
      RF: RF-67, RF-68, RF-69
      Archivos: src/server/use-cases/point-deductions.ts, src/app/(admin)/mis-ligas/[leagueId]/deduction-actions.ts, src/components/league/deductions-section.tsx, tests/e2e/deductions.spec.ts
      Hecho cuando: el E2E aplica dos descuentos al mismo equipo, edita uno y elimina el otro, y rechaza 0 puntos y un motivo vacío o de 101 caracteres.

## Fase 4 - Fechas, partidos y tablas

- [x] T63 - Crear el caso de uso de generar una fecha
      RF: RF-41, RF-42, RF-44, RF-45, RF-99, RF-100
      Archivos: src/server/use-cases/generate-matchday.ts, tests/integration/generate-matchday.test.ts
      Hecho cuando: los tests crean la fecha con todos sus partidos pendientes y el orden del dominio, y rechazan menos de 3 equipos, una fecha abierta existente y un día repetido.

- [x] T64 - Crear el diálogo de generar fecha y la lista de fechas con número y estado
      RF: RF-43, RF-48, RF-97, RF-104, RF-105
      Archivos: src/components/matchday/generate-matchday-dialog.tsx, src/components/league/matchdays-section.tsx, src/app/(admin)/mis-ligas/[leagueId]/matchday-actions.ts, tests/e2e/matchdays.spec.ts
      Hecho cuando: el diálogo propone el día actual, la fecha creada aparece con su número y estado "Abierta", y una fecha con día anterior toma el número intermedio.

- [x] T65 - Cambiar el día de juego de una fecha
      RF: RF-43, RF-98, RF-99
      Archivos: src/server/use-cases/update-matchday-date.ts, src/app/(admin)/mis-ligas/[leagueId]/matchday-actions.ts, tests/e2e/matchdays.spec.ts
      Hecho cuando: el E2E cambia el día y la numeración se reordena, y un día repetido se rechaza.

- [x] T66 - Eliminar una fecha con confirmación
      RF: RF-50, RF-51
      Archivos: src/server/use-cases/delete-matchday.ts, src/app/(admin)/mis-ligas/[leagueId]/matchday-actions.ts, tests/e2e/matchdays.spec.ts
      Hecho cuando: el diálogo indica cuántos partidos terminados se perderán y, tras confirmar, la fecha, sus partidos y sus goles ya no existen y las demás fechas se renumeran.

- [x] T67 - Crear la vista de la fecha con lectura hidratada y ruta GET
      RF: RF-47, RF-52
      Archivos: src/app/(admin)/mis-ligas/[leagueId]/fechas/[matchdayId]/page.tsx, src/app/api/leagues/[leagueId]/matchdays/[matchdayId]/route.ts, src/server/queries/matchday.ts, src/components/matchday/match-card.tsx
      Hecho cuando: la vista muestra los partidos en orden con equipos, marcador y estado, y la ruta GET responde 403 a otro ayudante y 401 sin sesión.

- [x] T68 - Reordenar los partidos de una fecha
      RF: RF-46
      Archivos: src/server/use-cases/reorder-matches.ts, src/app/(admin)/mis-ligas/[leagueId]/fechas/[matchdayId]/actions.ts, src/components/matchday/match-card.tsx, tests/e2e/matchday-view.spec.ts
      Hecho cuando: el E2E sube un partido una posición y el nuevo orden persiste al recargar.

- [x] T69 - Anotar un gol en 2 toques con actualización optimista
      RF: RF-53, RF-54, RF-55, RF-56
      Archivos: src/server/use-cases/add-goal.ts, src/app/(admin)/mis-ligas/[leagueId]/fechas/[matchdayId]/actions.ts, src/components/matchday/goal-sheet.tsx, tests/e2e/matchday-view.spec.ts
      Hecho cuando: el E2E anota un gol con exactamente 2 toques eligiendo entre jugadores de ambos equipos o "Gol sin autor", ve el marcador al instante y lo sigue viendo tras recargar.

- [x] T70 - Quitar y reasignar goles
      RF: RF-57
      Archivos: src/server/use-cases/remove-goal.ts, src/server/use-cases/reassign-goal.ts, src/app/(admin)/mis-ligas/[leagueId]/fechas/[matchdayId]/actions.ts, src/components/matchday/goal-list.tsx, tests/e2e/matchday-view.spec.ts
      Hecho cuando: el E2E quita un gol, reasigna otro a un jugador del otro equipo y el marcador refleja ambos cambios.

- [x] T71 - Terminar un partido y devolverlo a pendiente
      RF: RF-58, RF-59, RF-60, RF-84
      Archivos: src/server/use-cases/finish-match.ts, src/server/use-cases/revert-match.ts, src/app/(admin)/mis-ligas/[leagueId]/fechas/[matchdayId]/actions.ts, tests/integration/finish-match.test.ts
      Hecho cuando: terminar un partido (incluido un 0-0) hace que la tabla calculada sobre los datos persistidos lo cuente, y devolverlo a pendiente lo excluye conservando sus goles.

- [x] T72 - Crear los componentes de tabla de posiciones y de goleadores para 360 px
      RF: RF-62, RF-70, RF-71
      Archivos: src/components/standings/standings-table.tsx, src/components/standings/top-scorers-table.tsx, src/components/standings/deduction-note.tsx
      Hecho cuando: con 8 equipos de nombre de 30 caracteres la tabla cabe en 360 px sin desplazamiento horizontal y el asterisco muestra cada motivo con su cantidad.

- [x] T73 - Consultar las tablas desde la vista de la fecha
      RF: RF-60, RF-61
      Archivos: src/app/api/leagues/[leagueId]/tables/route.ts, src/server/queries/tables.ts, src/components/matchday/matchday-tabs.tsx, tests/e2e/matchday-view.spec.ts
      Hecho cuando: el E2E termina un partido, abre la pestaña de tabla sin salir de la vista y ve la tabla y los goleadores actualizados.

- [x] T74 - Finalizar una fecha con confirmación y bloquear sus partidos
      RF: RF-49, RF-101, RF-102, RF-103, RF-104, RF-105
      Archivos: src/server/use-cases/finalize-matchday.ts, src/app/(admin)/mis-ligas/[leagueId]/fechas/[matchdayId]/actions.ts, src/components/matchday/finalize-matchday-dialog.tsx, tests/e2e/matchday-view.spec.ts
      Hecho cuando: el E2E finaliza con 2 pendientes, la fecha queda "Incompleta (2)", los terminados ya no admiten cambios, juega los pendientes y al refinalizar queda "Finalizada".

- [x] T75 - Ofrecer finalizar la liga después de finalizar una fecha
      RF: RF-106
      Archivos: src/components/matchday/finalize-matchday-dialog.tsx, tests/e2e/matchday-view.spec.ts
      Hecho cuando: tras finalizar la fecha aparece "¿Era la última fecha del semestre?" con un botón que abre la finalización de la liga.

## Fase 5 - Parte pública y finalización de liga

- [x] T76 - Crear la portada con ligas en curso e historial por semestre
      RF: RF-12, RF-80, RF-108
      Archivos: src/app/(public)/page.tsx, src/server/queries/home.ts, tests/e2e/public.spec.ts
      Hecho cuando: el E2E ve "No hay ligas en curso por ahora" sin ligas, y con ligas de dos semestres las ve agrupadas del más reciente al más antiguo, sin ninguna acción de edición.

- [x] T77 - Crear la vista pública de una liga en curso
      RF: RF-14, RF-81, RF-83
      Archivos: src/app/(public)/ligas/[leagueId]/page.tsx, src/server/queries/public-league.ts, tests/e2e/public.spec.ts
      Hecho cuando: sin sesión el E2E ve tabla, goleadores y fechas con número, día, estado y marcadores, ve un partido recién terminado al recargar, y el HTML no contiene el correo del dueño.

- [x] T78 - Crear el caso de uso de finalizar una liga con snapshot
      RF: RF-74, RF-75, RF-76, RF-77
      Archivos: src/server/use-cases/finalize-league.ts, src/domain/snapshot.ts, tests/integration/finalize-league.test.ts
      Hecho cuando: los tests guardan el snapshot con ambas tablas, descuentos y equipo de cada goleador, borran fechas, partidos, goles y descuentos, conservan equipos, jugadores y escudos, aceptan una liga sin fechas y rechazan cualquier edición posterior.

- [x] T79 - Crear el diálogo de finalizar liga
      RF: RF-73
      Archivos: src/components/league/finalize-league-dialog.tsx, src/app/(admin)/mis-ligas/[leagueId]/actions.ts, tests/e2e/finalize-league.spec.ts
      Hecho cuando: el diálogo advierte que no se puede deshacer y cuántos partidos pendientes se descartarán, y al confirmar la liga pasa a finalizadas.

- [x] T80 - Crear la vista pública de una liga finalizada
      RF: RF-82
      Archivos: src/app/(public)/ligas/[leagueId]/page.tsx, src/components/league/finalized-league.tsx, tests/e2e/finalize-league.spec.ts
      Hecho cuando: el E2E ve en el historial la tabla final, los goleadores con su equipo y los equipos con sus jugadores y escudos.

- [x] T81 - Verificar la visibilidad y la autorización de extremo a extremo
      RF: RF-12, RF-13, RF-14, RF-93
      Archivos: tests/e2e/visibility.spec.ts
      Hecho cuando: sin sesión no hay acciones en ninguna página pública, un ayudante ajeno ve solo la vista pública, las rutas GET privadas de una liga ajena responden 403, y ninguna página pública contiene correos.

- [x] T82 - Verificar que el último cambio gana entre dos dispositivos
      RF: RF-85
      Archivos: tests/integration/last-write-wins.test.ts
      Hecho cuando: dos renombres consecutivos del mismo equipo desde dos sesiones dejan el nombre del último.

## Fase 6 - Requisitos no funcionales y entrega

- [x] T83 - Verificar el ancho de 360 px en todas las páginas
      RF: [SIN RF] (RNF-3)
      Archivos: tests/e2e/responsive.spec.ts
      Hecho cuando: en cada página principal, pública y autenticada, `document.documentElement.scrollWidth` no supera 360.

- [x] T84 - Medir la carga de la tabla pública con red y CPU limitadas
      RF: [SIN RF] (RNF-2)
      Archivos: tests/e2e/performance.spec.ts
      Hecho cuando: con 150 ms de latencia, 1,6 Mbps y CPU 4 veces más lenta, con caché vacía, la tabla es visible en menos de 3 s contra el build local, y el test acepta `BASE_URL` para correr contra producción.

- [x] T85 - Cubrir el flujo principal de los criterios de finalización
      RF: [SIN RF] (criterios de finalización de la spec 001)
      Archivos: tests/e2e/main-flow.spec.ts
      Hecho cuando: un solo E2E a 360 px registra con código, crea liga, 4 equipos y jugadores, genera fecha, anota goles, termina un partido, ve la tabla pública sin sesión y finaliza la fecha.

- [x] T86 - (manual, autor) Publicar en producción y registrar la medición de RNF-2
      RF: [SIN RF] (criterios de finalización de la spec 001)
      Archivos: ninguno (resultado en la descripción del PR de validación)
      Hecho cuando: la app responde en su URL de producción y `tests/e2e/performance.spec.ts` contra producción, con la base suspendida, queda registrado con su tiempo medido.
      Resultado: 2026-10-05, liga `cmuvl8nz9000004l25do20pa1` en producción con Neon suspendida, tabla visible en 1778 ms (límite 3000 ms).

- [x] T87 - Ordenar los partidos con el mínimo posible de partidos consecutivos del mismo equipo
      RF: RF-44
      Archivos: src/domain/scheduling.ts, src/domain/scheduling.test.ts
      Hecho cuando: con 100 semillas, los órdenes de 3 y 4 equipos tienen exactamente 2 pares de partidos consecutivos que comparten un equipo y los de 5 a 8 equipos tienen 0.

- [x] T88 - Leer `ADMIN_EMAILS` y aceptar administradores en `requireOwnedLeague` [AÑADIDO]
      RF: RF-13, RF-109, RF-112
      Archivos: src/server/env.ts, src/server/env.test.ts, src/server/authz.ts, tests/integration/authz.test.ts, .env.example, vitest.config.ts, playwright.config.ts, .github/workflows/ci.yml
      Hecho cuando: los tests devuelven una liga ajena a una cuenta cuyo correo está en la lista (sin importar mayúsculas ni espacios), responden `FORBIDDEN` a la misma cuenta sin estar en la lista, y `env` acepta `ADMIN_EMAILS` ausente o vacía.

- [x] T89 - Mostrar al administrador las ligas de los demás y el aviso en las ligas ajenas [AÑADIDO]
      RF: RF-93, RF-109, RF-110, RF-111
      Archivos: src/server/queries/my-leagues.ts, src/app/(admin)/mis-ligas/page.tsx, src/app/(admin)/mis-ligas/[leagueId]/owned-league.ts, src/app/(admin)/mis-ligas/[leagueId]/layout.tsx, tests/e2e/admin.spec.ts
      Hecho cuando: el E2E con una cuenta administradora ve en "Mis ligas" la liga de otro ayudante sin datos de su dueño, la abre con el aviso "Estás editando la liga de otro ayudante", genera una fecha y anota un gol; un ayudante que no es administrador sigue siendo llevado a la vista pública.

- [x] T90 - (manual, autor) Cargar `ADMIN_EMAILS` en Vercel [AÑADIDO]
      RF: RF-112
      Archivos: ninguno (configuración de Vercel)
      Hecho cuando: Production y Preview tienen `ADMIN_EMAILS` con el correo del autor, y con esa cuenta se abre en producción la administración de una liga de otro ayudante.
      Resultado: 2026-10-05, el autor creó la cuenta con el correo de `ADMIN_EMAILS` y editó en producción una liga creada por otra cuenta de ayudante.

- [x] T91 - Quitar el cambio de correo de `/cuenta` [AÑADIDO]
      RF: RF-87, RF-88 (eliminados), RF-90
      Archivos: src/app/(admin)/cuenta/page.tsx, src/app/(admin)/cuenta/actions.ts, src/app/(admin)/cuenta/change-email-form.tsx, src/server/use-cases/change-email.ts, tests/e2e/account.spec.ts
      Hecho cuando: `/cuenta` muestra el correo del titular pero ya no ofrece cambiarlo, el caso de uso y su acción no existen, y los E2E de cambio de correo se reemplazan por uno que verifica que la opción no aparece.

- [x] T92 - Cubrir el recálculo de las tablas al modificar un gol de un partido terminado [AÑADIDO]
      RF: RF-60
      Archivos: tests/integration/finish-match.test.ts
      Hecho cuando: en un partido terminado no bloqueado, quitar un gol y reasignar otro al otro equipo cambia la tabla de posiciones y la de goleadores calculadas sobre los datos guardados.

- [x] T93 - Definir la paleta de color verde con los tokens de shadcn/ui [AÑADIDO]
      RF: [SIN RF] (plan D22)
      Archivos: src/app/globals.css, src/components/layout/site-header.tsx
      Hecho cuando: botones principales, cabecera y elementos activos usan el primario verde, el fondo es gris claro con tarjetas blancas, el texto mantiene un contraste de al menos 4,5:1 y la suite E2E sigue en verde.

- [x] T94 - Dividir la administración de la liga en subpáginas con menú lateral [AÑADIDO]
      RF: [SIN RF] (plan D22; mantiene RF-93, RF-94 y RF-106)
      Archivos: src/app/(admin)/mis-ligas/[leagueId]/layout.tsx, src/app/(admin)/mis-ligas/[leagueId]/equipos/page.tsx, src/app/(admin)/mis-ligas/[leagueId]/fechas/page.tsx, src/app/(admin)/mis-ligas/[leagueId]/descuentos/page.tsx, src/app/(admin)/mis-ligas/[leagueId]/ajustes/page.tsx, src/components/layout/league-nav.tsx, tests/e2e/league-navigation.spec.ts
      Hecho cuando: el menú lleva a Resumen, Equipos, Fechas, Descuentos y Ajustes con la vista actual marcada; a 360 px se abre y se cierra con su botón sin desplazamiento horizontal; en pantallas anchas queda fijo; los accesos a finalizar la liga llevan a Ajustes, y los E2E existentes siguen en verde con las rutas nuevas.

- [x] T95 - Crear la vista Resumen de la liga [AÑADIDO]
      RF: [SIN RF] (plan D22)
      Archivos: src/app/(admin)/mis-ligas/[leagueId]/page.tsx, src/server/queries/league-admin.ts, tests/e2e/league-navigation.spec.ts
      Hecho cuando: el E2E ve el estado de la liga, llega a la fecha abierta en un toque, copia el link público con un botón, y en una liga de un semestre terminado ve el aviso con acceso a finalizarla.

## Trazabilidad
| RF | Tareas |
|---|---|
| RF-1 | T39 |
| RF-2 | T38, T39 |
| RF-3 | T39 |
| RF-4 | T39, T44, T46 |
| RF-5 | T35, T39 |
| RF-6 | T35, T40 |
| RF-7 | T34, T41 |
| RF-8 | T40 |
| RF-9 | T43 |
| RF-10 | T42, T43 |
| RF-11 | T44 |
| RF-12 | T49, T76, T81 |
| RF-13 | T45, T81, T88 |
| RF-14 | T77, T81 |
| RF-15 | T51 |
| RF-16 | T19, T51 |
| RF-17 | T19, T51 |
| RF-18 | T36, T51, T53 |
| RF-19 | T18, T51 |
| RF-20 | T53 |
| RF-21 | T36, T50 |
| RF-22 | T50 |
| RF-23 | T33, T55 |
| RF-24 | T33, T55 |
| RF-25 | T56, T58 |
| RF-26 | T36, T55, T56 |
| RF-27 | T18, T55 |
| RF-28 | T57 |
| RF-29 | T57 |
| RF-30 | T57 |
| RF-31 | T58 |
| RF-32 | T58 |
| RF-33 | T59 |
| RF-34 | T59 |
| RF-35 | T36, T59 |
| RF-36 | T18, T59 |
| RF-37 | T33, T37, T60 |
| RF-38 | T60 |
| RF-39 | T61 |
| RF-40 | T32, T37, T61 |
| RF-41 | T33, T63 |
| RF-42 | T26, T63 |
| RF-43 | T23, T64, T65 |
| RF-44 | T87, T63 |
| RF-45 | T28, T63 |
| RF-46 | T68 |
| RF-47 | T21, T67 |
| RF-48 | T24, T64 |
| RF-49 | T24, T74 |
| RF-50 | T66 |
| RF-51 | T66 |
| RF-52 | T67 |
| RF-53 | T69 |
| RF-54 | T69 |
| RF-55 | T21, T69 |
| RF-56 | T21, T32, T69 |
| RF-57 | T22, T70 |
| RF-58 | T22, T71 |
| RF-59 | T29, T71 |
| RF-60 | T71, T73, T92 |
| RF-61 | T73 |
| RF-62 | T29, T72 |
| RF-63 | T29 |
| RF-64 | T30 |
| RF-65 | T31 |
| RF-66 | T31 |
| RF-67 | T62 |
| RF-68 | T62 |
| RF-69 | T30, T62 |
| RF-70 | T30, T72 |
| RF-71 | T32, T72 |
| RF-72 | T32 |
| RF-73 | T79 |
| RF-74 | T78 |
| RF-75 | T78 |
| RF-76 | T33, T45, T78 |
| RF-77 | T78 |
| RF-78 | T54 |
| RF-79 | T54 |
| RF-80 | T76 |
| RF-81 | T77 |
| RF-82 | T80 |
| RF-83 | T77 |
| RF-84 | T22, T71 |
| RF-85 | T82 |
| RF-86 | T44 |
| RF-87 | (eliminado; se quita en T91) |
| RF-88 | (eliminado; se quita en T91) |
| RF-89 | T46 |
| RF-90 | T46, T91 |
| RF-91 | T48 |
| RF-92 | T48 |
| RF-93 | T52, T81, T89 |
| RF-94 | T20, T50 |
| RF-95 | T55 |
| RF-96 | T55 |
| RF-97 | T64 |
| RF-98 | T65 |
| RF-99 | T37, T63, T65 |
| RF-100 | T33, T63 |
| RF-101 | T74 |
| RF-102 | T25, T74 |
| RF-103 | T22, T74 |
| RF-104 | T24, T64, T74 |
| RF-105 | T24, T64, T74 |
| RF-106 | T75 |
| RF-107 | T31 |
| RF-108 | T76 |
| RF-109 | T88, T89 |
| RF-110 | T89 |
| RF-111 | T89 |
| RF-112 | T88, T90 |
