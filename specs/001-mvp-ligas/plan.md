# Plan 001 - MVP de ligas internas

## Enfoque general
Una sola app Next.js (App Router) en Vercel sobre Postgres en Neon, con Prisma, Better Auth y la estructura por capas de ADR 016. Las reglas de la liga (orden de fechas, estados, tablas, desempates, bloqueo) viven en `src/domain` como funciones puras; cada escritura es un caso de uso en `src/server/use-cases` invocado por una Server Action con resultado tipado; las páginas públicas son componentes de servidor que calculan las tablas al leer, y solo las vistas autenticadas usan TanStack Query.

## Módulos y responsabilidades

### Dominio (`src/domain`, puro, sin efectos)
- `names`: normaliza nombres (`nameKey`: minúsculas y sin espacios exteriores) y valida largo y vacío por entidad (liga 60, equipo 30, jugador 40). No consulta unicidad; eso lo hace la base con índices únicos sobre `nameKey`.
- `semester`: valida el formato `AAAA-1`/`AAAA-2`, calcula el semestre de un día y si un semestre ya terminó respecto de "hoy". No lee el reloj.
- `scheduling`: genera los partidos todos contra todos de una fecha y su orden (RF-42, RF-44, RF-45) a partir de la lista de equipos, el primer partido de la fecha anterior y un generador aleatorio inyectado. No persiste.
- `matchdays`: numera fechas por orden cronológico (RF-43) y deriva su estado (abierta, incompleta, finalizada) desde `finalizedAt` y los estados de sus partidos (RF-48, RF-104, RF-105).
- `matches`: marcador desde goles (RF-55) y reglas de transición: agregar, quitar o reasignar gol, terminar, devolver a pendiente, bloquear (RF-57, RF-58, RF-84, RF-102, RF-103).
- `standings`: tabla de posiciones con puntos 3-1-0, descuentos, orden y desempates (RF-62 a RF-66, RF-107) y tabla de goleadores con posiciones compartidas (RF-71, RF-72), a partir de partidos terminados, goles, equipos, jugadores y descuentos.
- `league-rules`: permisos por estado de la liga (en curso o finalizada), mínimo de equipos, alta y baja de equipos según existan fechas, borrado de jugador con goles (RF-23, RF-24, RF-37, RF-41, RF-76, RF-100).
- `login-lockout`: decide si un correo está bloqueado dado su historial de intentos fallidos y "ahora" (RF-7).
- `result`: tipo `Result<T>` con `{ ok: true, data } | { ok: false, error: { code, message, fields? } }` y el catálogo de códigos de rechazo con sus mensajes en español (ADR 010).

### Servidor (`src/server`)
- `env` [MODIFICADO]: valida todas las variables de entorno al arrancar con Zod y falla si falta alguna obligatoria; `ADMIN_EMAILS` es opcional (D21). (Anterior: valida todas las variables de entorno al arrancar con Zod y falla si falta alguna.)
- `time`: único lector del reloj; entrega "hoy" (`YYYY-MM-DD`) y "ahora" en `America/Santiago` (ADR 015).
- `db`: cliente de Prisma con el adaptador de Neon; convierte `Date` de columnas `date` a `YYYY-MM-DD` y viceversa.
- `auth`: configuración de Better Auth (sesión de 30 días sin renovación, recuperación de 1 hora, revocación de sesiones, sin registro de IP), hooks de código de invitación y de bloqueo por intentos, y el helper `requireSession()`.
- `authz` [MODIFICADO]: `requireOwnedLeague(userId, leagueId, { mustBeInProgress })`, que devuelve la liga a su dueño o a una cuenta administradora (D21), o un rechazo `NOT_FOUND`, `FORBIDDEN` o `LEAGUE_FINALIZED`; las verificaciones por equipo, jugador, fecha, partido, gol y descuento se apoyan en ella. Lo usan todos los casos de uso y las rutas GET privadas. (Anterior: `requireOwnedLeague(leagueId, { mustBeInProgress })`, que devuelve la liga o un rechazo `NOT_FOUND`, `FORBIDDEN` o `LEAGUE_FINALIZED`. Lo usan todos los casos de uso y las rutas GET privadas.)
- `email`: envío por SMTP (ADR 006) y plantilla del correo de recuperación en español.
- `crests`: valida el contenido real del archivo, lo reduce a 256 px y lo recodifica a WebP, y calcula su hash (ADR 007).
- `use-cases`: un archivo por operación de escritura (lista en la tabla de cobertura). Cada uno sigue el orden de ADR 008: sesión, dueño, carga, reglas de dominio, persistencia en transacción cuando toca varias tablas.
- `queries`: lecturas para páginas y rutas GET: portada, liga pública (en curso o finalizada), mis ligas, administración de liga, vista de fecha y tablas. Nunca seleccionan el correo de un ayudante salvo en la vista de su propia cuenta.

### Interfaz (`src/app`, `src/components`)
- Rutas públicas `(public)`: `/` (portada), `/ligas/[leagueId]` (liga en curso o finalizada), `/escudos/[teamId]/[hash]` (ruta que sirve el escudo).
- Rutas de cuenta: `/ingresar`, `/registro`, `/recuperar`, `/restablecer`, `/cuenta`.
- Rutas autenticadas `(admin)`: `/mis-ligas`, `/mis-ligas/nueva`, `/mis-ligas/[leagueId]` (equipos, jugadores, descuentos, fechas), `/mis-ligas/[leagueId]/fechas/[matchdayId]` (vista de la fecha). El layout de `(admin)` exige sesión y monta el proveedor de TanStack Query.
- Rutas GET privadas para TanStack Query (ADR 011): `/api/leagues/[leagueId]/matchdays/[matchdayId]` y `/api/leagues/[leagueId]/tables`.
- `src/app/**/actions.ts`: Server Actions que validan la entrada con Zod y llaman al caso de uso; no contienen reglas.
- `components/ui`: componentes de shadcn/ui (AlertDialog, Dialog, Sheet, Select, Button, Input, Tabs, Sonner).
- `components/standings`, `components/matchday`, `components/league`, `components/crest`: componentes de la app. `crest` incluye el escudo genérico con la inicial (RF-31).

### Infraestructura del repo
- `docker-compose.yml`: Postgres 17 y Mailpit para desarrollo local.
- `.github/workflows/ci.yml`: el pipeline de ADR 014, con servicios Postgres 17 y Mailpit.
- `vercel.json`: región de funciones `gru1`.
- `prisma/schema.prisma` y `prisma/migrations/`.

## Modelo de datos
Tablas de Better Auth (`user`, `session`, `account`, `verification`) generadas por su CLI; `user.name` se guarda vacío y `session.ipAddress` y `session.userAgent` quedan siempre nulos. Tablas propias:

```
LoginFailure      id, email (normalizado), createdAt                         índice (email, createdAt)
League            id, ownerId → user (cascade), name, nameKey, semester,
                  status (IN_PROGRESS | FINALIZED), finalizedAt?, createdAt, updatedAt
                  único (semester, nameKey)
Team              id, leagueId → League (cascade), name, nameKey, createdAt  único (leagueId, nameKey)
TeamCrest         teamId (PK) → Team (cascade), data (bytea, WebP), hash, updatedAt
Player            id, leagueId → League (cascade), teamId → Team (cascade), name, nameKey
                  único (leagueId, nameKey)
Matchday          id, leagueId → League (cascade), playDate (date), finalizedAt?, createdAt
                  único (leagueId, playDate)
Match             id, matchdayId → Matchday (cascade), position, teamAId → Team, teamBId → Team,
                  status (PENDING | FINISHED), locked (bool)
Goal              id, matchId → Match (cascade), teamId → Team (equipo al que suma),
                  scorerId? → Player (restrict), createdAt
PointDeduction    id, teamId → Team (cascade), points (>0), reason (≤100), createdAt
LeagueSnapshot    leagueId (PK) → League (cascade), standings (jsonb), topScorers (jsonb), createdAt
```

- El número de fecha no se guarda: se calcula (RF-43).
- El marcador no se guarda: se cuenta desde `Goal` (RF-55).
- Las tablas no se guardan mientras la liga está en curso (ADR 009); al finalizar se escribe `LeagueSnapshot`, se borran `Matchday` (en cascada partidos y goles) y `PointDeduction`, y se conservan `Team`, `TeamCrest` y `Player` (RF-74, RF-75).
- Borrar un `user` borra en cascada sus sesiones, ligas y todo lo que cuelga de ellas, incluidos escudos (RF-92).

## Decisiones

### D1. El escudo en una tabla propia `TeamCrest`
- Decisión: los bytes del escudo viven en `TeamCrest`, uno a uno con `Team`, y `Team` no tiene columnas binarias.
- Por qué: las consultas de equipos, tablas y portada nunca cargan bytes por accidente; solo la ruta `/escudos` los lee.
- Alternativa descartada: columna `crest` en `Team`. Por qué no: cualquier `findMany` sin `select` explícito traería los binarios de todos los equipos.

### D2. Unicidad de nombres con columna `nameKey` e índice único
- Decisión: cada nombre guarda también `nameKey` normalizada por el dominio, con índice único por ámbito (RF-18, RF-26, RF-35); la violación del índice se traduce a `DUPLICATE_NAME`.
- Por qué: la base garantiza la regla aun con dos pedidos simultáneos, y la normalización es una sola función testeada.
- Alternativa descartada: extensión `citext` o comprobar en código antes de insertar. Por qué no: `citext` es una extensión (ADR 003 pide Postgres estándar) y no ignora espacios; comprobar antes deja una carrera entre lectura y escritura.

### D3. Número de fecha y estados derivados, no guardados
- Decisión: el número se calcula ordenando por `playDate` (RF-43) y el estado de la fecha se deriva de `finalizedAt` y de sus partidos pendientes.
- Por qué: borrar una fecha o cambiar su día renumera sola, sin actualizar filas.
- Alternativa descartada: guardar `number` y `status`. Por qué no: cada alta, baja o cambio de día obligaría a renumerar y podría dejar números repetidos o huecos.

### D4. Bloqueo de partido como columna `locked`
- Decisión: finalizar una fecha pone `locked = true` en sus partidos terminados (RF-102); el dominio rechaza cambios sobre partidos bloqueados (RF-103).
- Por qué: con fechas incompletas que se finalizan varias veces, el bloqueo es por partido y no por fecha.
- Alternativa descartada: derivar el bloqueo comparando la hora de término del partido con `finalizedAt`. Por qué no: exige guardar horas de término, y una corrección de reloj o un partido devuelto a pendiente lo vuelve ambiguo.

### D5. El gol guarda explícitamente el equipo al que suma
- Decisión: `Goal.teamId` es el equipo cuyo marcador sube; `scorerId` es opcional ("Gol sin autor").
- Por qué: el traspaso posterior del autor no debe cambiar marcadores (RF-40), y un gol sin autor igual necesita equipo (RF-56).
- Alternativa descartada: deducir el equipo desde el jugador. Por qué no: tras un traspaso cambiaría el marcador de partidos pasados y no sirve para goles sin autor.

### D6. Orden de la fecha por búsqueda con retroceso y aleatoriedad inyectada
- Decisión: `scheduling` genera los pares, los baraja con un generador aleatorio recibido por parámetro y busca por retroceso un orden cuyo primer partido no repita el par que abrió la fecha anterior y que tenga a lo más k pares de partidos consecutivos que comparten un equipo, empezando con k = 0 y subiendo k de a uno hasta encontrar un orden; ese k es el mínimo posible (2 con 3 o 4 equipos, 0 desde 5).
- Por qué: subir k desde 0 garantiza el mínimo que exige RF-44; solo con 4 equipos (6 partidos) la búsqueda agota los niveles 0 y 1, y desde 5 equipos encuentra un orden con k = 0 de inmediato. El generador inyectado hace los tests deterministas.
- Alternativa descartada: método del círculo (rondas fijas) con rotación. Por qué no: no garantiza la ausencia de consecutivos al concatenar rondas y siempre produce las mismas secuencias.

### D7. Snapshot final como JSON
- Decisión: `LeagueSnapshot` guarda ambas tablas ya calculadas como `jsonb`, con nombres de equipos y jugadores, descuentos con sus motivos y el equipo de cada goleador, validadas con un esquema Zod al leer.
- Por qué: una liga finalizada es de solo lectura y se muestra tal cual; nada vuelve a calcularse (ADR 009).
- Alternativa descartada: tablas normalizadas de snapshot. Por qué no: más tablas y migraciones para datos que nunca se consultan por partes.

### D8. Flujos de cuenta por Server Actions que llaman a la API de servidor de Better Auth
- Decisión: registro, inicio de sesión, recuperación, cambio de contraseña y cierre de sesión se hacen con Server Actions que llaman a `auth.api.*` y traducen sus errores al catálogo de `result` en español; los endpoints HTTP de Better Auth quedan montados en `/api/auth/*` pero el hook de registro exige el código de invitación también ahí.
- Por qué: un solo contrato de errores en toda la app (ADR 010) y mensajes de la spec exactos (RF-2, RF-3, RF-4, RF-9).
- Alternativa descartada: usar el cliente de Better Auth desde el navegador. Por qué no: sus errores llegan en inglés y con otra forma, y habría dos contratos de error.

### D9. Código de invitación validado en un hook `before` del registro
- Decisión: un hook de Better Auth sobre `/sign-up/email` compara el código recibido con `INVITE_CODE` en tiempo constante y rechaza si no coincide (RF-2).
- Por qué: cubre tanto la Server Action como una llamada directa a `/api/auth/sign-up/email`, que de otro modo permitiría registrarse sin código.
- Alternativa descartada: validar solo en la Server Action. Por qué no: el endpoint HTTP de Better Auth quedaría abierto sin código.

### D10. Bloqueo por intentos con tabla `LoginFailure` y limitador de Better Auth desactivado
- Decisión: un hook `before` de `/sign-in/email` consulta los fallos del correo en los últimos 15 minutos y aplica `login-lockout`; un hook `after` registra el fallo. El limitador propio de Better Auth queda desactivado.
- Por qué: RF-7 pide bloqueo por correo; el limitador de Better Auth es por IP y en memoria, lo que en funciones serverless no persiste entre invocaciones.
- Alternativa descartada: limitador de Better Auth con almacenamiento en base. Por qué no: sigue siendo por IP (no es lo que pide RF-7) y guardaría IPs.

### D11. Sin IP ni user agent en sesiones
- Decisión: `advanced.ipAddress.disableIpTracking` activo y `userAgent` anulado en un hook de base de datos al crear la sesión.
- Por qué: no se necesitan para ningún RF y reducen datos asociados a personas (principio 4).
- Alternativa descartada: dejar el comportamiento por defecto. Por qué no: acumula IPs y navegadores de los ayudantes sin uso.

### D12. Cambio de correo y eliminación de cuenta como casos de uso propios
- Decisión: `changeEmail` verifica la contraseña actual con el verificador de hash de Better Auth y luego actualiza el correo sin verificación (RF-87, RF-88, RF-90); `deleteAccount` borra el usuario en una transacción (cascada a ligas y sesiones) y limpia la cookie (RF-92).
- Por qué: el cambio de correo de Better Auth no pide contraseña actual, y su borrado de usuario exige una sesión reciente, que con sesiones de 30 días fallaría a menudo.
- Alternativa descartada: los endpoints `changeEmail` y `deleteUser` de Better Auth tal cual. Por qué no: no cumplen RF-87 y RF-90, y el requisito de sesión reciente rompe RF-91.

### D13. Páginas públicas renderizadas en cada petición
- Decisión: la portada y la liga pública se renderizan dinámicamente en cada visita, sin caché de página.
- Por qué: RF-83 exige datos vigentes al recargar, y sin caché no hay invalidaciones que puedan olvidarse.
- Alternativa descartada: caché de página con invalidación por etiquetas en cada caso de uso. Por qué no: un caso de uso que olvide invalidar deja la tabla pública desactualizada, el mismo problema que ADR 009 evita. Se reevalúa si la medición de RNF-2 falla.

### D14. Rutas en español, identificadores en inglés
- Decisión: los segmentos de URL visibles (`/mis-ligas`, `/ligas`, `/fechas`, `/escudos`) van en español; los nombres de archivos de código, funciones y tablas van en inglés.
- Por qué: la URL es parte de la interfaz (principio 6); el código sigue el glosario de `AGENTS.md`.
- Alternativa descartada: rutas en inglés. Por qué no: los alumnos ven y comparten esas URLs.

### D15. Días como texto `YYYY-MM-DD` en el dominio
- Decisión: el dominio trabaja con días como cadenas `YYYY-MM-DD`; solo `db` convierte a y desde `Date` de Prisma.
- Por qué: un `Date` de JavaScript tiene hora y zona, y un día de juego no (ADR 015); las cadenas ISO además se ordenan bien.
- Alternativa descartada: `Date` en todo el código. Por qué no: una conversión con la zona del servidor corre el día en uno.

### D16. Subida de escudo por Server Action con límite de 3 MB
- Decisión: `serverActions.bodySizeLimit = "3mb"` en `next.config`; el caso de uso rechaza archivos de más de 2 MB antes de decodificarlos y limita los píxeles de entrada al procesarlos.
- Por qué: el límite por defecto de Next.js (1 MB) rechazaría archivos válidos de hasta 2 MB (RF-28); el límite de píxeles evita imágenes comprimidas que al abrirse agotan la memoria.
- Alternativa descartada: reducir la imagen en el navegador antes de subirla. Por qué no: el servidor igual tiene que validar el contenido real (RF-29), y suma código de cliente.

### D17. Reordenar partidos con botones subir y bajar
- Decisión: cada partido de la fecha tiene botones para moverlo una posición (RF-46).
- Por qué: se usa en el celular, donde arrastrar dentro de una lista con scroll es impreciso, y no requiere una librería.
- Alternativa descartada: arrastrar y soltar. Por qué no: agrega una dependencia y es incómodo en 360 px.

### D18. Región São Paulo para Neon y Vercel (ver ADR 017)
- Decisión: proyecto de Neon en `aws-sa-east-1` y funciones de Vercel en `gru1`.
- Por qué: es la región más cercana a Chile en ambos proveedores y deja función y base en la misma zona, lo que reduce la latencia de cada consulta (RNF-2).
- Alternativa descartada: regiones por defecto en Estados Unidos (`iad1`, `aws-us-east-1`). Por qué no: suma unos 150 ms de ida y vuelta desde Chile por cada petición.

### D19. Correos de prueba capturados con Mailpit (ver ADR 018)
- Decisión: en local y en CI el SMTP apunta a Mailpit, y los E2E leen el link de recuperación desde su API HTTP.
- Por qué: los E2E ejercen el mismo camino SMTP que producción (RF-10, RF-11).
- Alternativa descartada: un transporte de prueba que escribe el correo en un archivo. Por qué no: no prueba el envío SMTP real.

### D20. Datos de E2E creados por fixtures con Prisma sobre una base reiniciada (ver ADR 019)
- Decisión: cada ejecución de E2E reinicia la base con las migraciones; cada test crea sus datos previos directamente con Prisma, con nombres y correos únicos, y usa la interfaz solo para el flujo que verifica.
- Por qué: tests independientes entre sí, sin datos sobrantes, y rápidos.
- Alternativa descartada: crear todo por la interfaz en cada test. Por qué no: tests lentos y un fallo en la creación de ligas rompería todos los demás.

### D21. Administradores por la variable `ADMIN_EMAILS`, evaluada en `requireOwnedLeague` [AÑADIDO]
- Decisión: `ADMIN_EMAILS` es una lista opcional de correos separados por coma, normalizados a minúsculas (RF-112). `requireOwnedLeague` deja pasar al dueño o a la cuenta de la sesión cuyo correo está en la lista (RF-13, RF-109), y compara el correo de la cuenta en cada petición, así que la cuenta puede crearse antes o después de agregar su correo; un cambio de la lista se aplica en el siguiente deploy (en Vercel, cambiar una variable exige volver a desplegar). "Mis ligas" agrega para el administrador las ligas de los demás sin datos de sus dueños (RF-110, RF-14), y el layout de la liga muestra el aviso de RF-111 cuando el administrador no es el dueño.
- Por qué: toda la autorización ya pasa por `requireOwnedLeague`, así que un solo punto habilita al administrador en todos los casos de uso y rutas GET; no requiere migración, y la lista se cambia en Vercel sin tocar código, lo que permite sumar al profesor con su propia cuenta sin compartir contraseñas.
- Alternativa descartada: columna `isAdmin` en `user`. Por qué no: exige migración y entrar a Neon con SQL para nombrar o quitar administradores.
- Alternativa descartada: el plugin de administración de Better Auth. Por qué no: agrega roles, bloqueos y suplantación de usuarios que la spec no pide, con tablas y endpoints extra que proteger.

## Estrategia de tests

**Unitarios (Vitest, `src/domain/**/*.test.ts`)** — sin base ni Next.js:
- `names`: normalización, largos límite (60/30/40 y uno más), vacío y solo espacios.
- `semester`: formato válido e inválido, semestre de un día en los bordes (31/07 y 01/08), semestre terminado.
- `scheduling`: todos los pares exactamente una vez para 3 a 8 equipos; mínimo de consecutivos (2 con 3 y 4 equipos, 0 con 5 a 8) con muchas semillas; RF-45 con y sin fecha anterior; 3 equipos cumple RF-45; el escenario de 4 equipos de la spec.
- `matchdays`: numeración cronológica y el escenario 10/09, 20/09, 24/09; estados abierta, incompleta y finalizada.
- `matches`: marcador desde goles, gol sin autor, transiciones permitidas y prohibidas con partido bloqueado.
- `standings`: 3-1-0, descuentos y puntos negativos, cada criterio de orden, los tres escenarios de desempate de la spec, posición compartida, partidos pendientes excluidos; goleadores con empate, gol sin autor excluido, equipo actual tras traspaso.
- `league-rules` y `login-lockout`: cada regla con su caso permitido y su rechazo, incluidos 4 y 5 fallos y el minuto 15.

**Integración de casos de uso (Vitest contra Postgres de Docker o CI)**:
- Autorización: cada caso de uso de escritura con un ayudante que no es dueño devuelve `FORBIDDEN` sin modificar datos (RF-13).
- Administración [AÑADIDO]: `requireOwnedLeague` acepta un correo de `ADMIN_EMAILS` en una liga ajena y lo rechaza al quitarlo de la lista; un E2E con una cuenta administradora carga una fecha en la liga de otro ayudante, ve el aviso de RF-111 y la lista de RF-110 (D21).
- Transacciones: finalizar liga, eliminar fecha, eliminar equipo y eliminar cuenta dejan la base consistente.
- Índices únicos traducidos a `DUPLICATE_NAME` y `DUPLICATE_PLAY_DATE`.

**E2E (Playwright, Chromium a 360 px, contra el build de producción)**:
- Registro con código correcto, código incorrecto, correo repetido y contraseña corta; llamada directa a `/api/auth/sign-up/email` sin código rechazada.
- Inicio de sesión, bloqueo tras 5 fallos, cierre de sesión.
- Recuperación completa con Mailpit, link vencido o reutilizado, sesiones cerradas tras restablecer.
- Cambio de correo, cambio de contraseña con cierre de otras sesiones, eliminación de cuenta.
- Flujo principal de los criterios de finalización: crear liga, 4 equipos, jugadores, generar fecha, anotar goles en 2 toques, terminar partido, ver tabla pública sin sesión, finalizar fecha.
- Fecha incompleta y reanudación; devolver partido a pendiente; reasignar gol al otro equipo.
- Escudos: subida válida, SVG rechazado, archivo renombrado rechazado, más de 2 MB rechazado, escudo genérico.
- Finalización de liga y su vista en el historial; eliminación de liga.
- Visibilidad: sin sesión no hay acciones; ayudante ajeno ve solo la vista pública; ninguna página pública contiene correos.
- RNF-3: en cada página principal, `document.documentElement.scrollWidth` no supera 360.
- RNF-1: el test de anotar gol verifica exactamente 2 interacciones.
- RNF-2: test que limita la red a 150 ms y 1,6 Mbps y la CPU a 4 veces, con caché vacía, y mide hasta que la tabla es visible; corre en CI contra el build local y se ejecuta una vez a mano contra producción para la medición registrada.

## Riesgos
- **Cuenta administradora comprometida [AÑADIDO].** Quien obtenga su contraseña puede modificar o eliminar cualquier liga. Lo acotan el bloqueo por intentos (RF-7), que la lista vive solo en la configuración (principio 5) y que quitar el correo de la lista y volver a desplegar corta el acceso (D21).
- **El hook de registro de Better Auth podría no recibir campos extra del cuerpo.** Si el esquema de su endpoint descarta `inviteCode` antes del hook, D9 no funciona tal cual. Se verifica con el E2E de llamada directa sin código en la primera tarea de autenticación; si falla, el endpoint HTTP de registro se desactiva con `disabledPaths` y el registro se hace solo por la Server Action.
- **Despertar de Neon en la primera visita.** Con la base suspendida, la primera carga pública suma el despertar del cómputo; si la medición en producción de RNF-2 no cumple, se reabre D13.
- **Tabla de posiciones en 360 px.** Nueve columnas (equipo y ocho números) caben justo; nombres de hasta 30 caracteres deben truncarse con elipsis y mostrarse completos al tocar.
- **Contraseñas de aplicación de Gmail.** Si Google las restringe, la recuperación deja de funcionar sin error visible para el usuario (ADR 006); el E2E de recuperación en CI usa Mailpit y no lo detecta.
- **URLs de prueba de Vercel y orígenes confiables.** Better Auth necesita aceptar los orígenes de las URLs de prueba (`*.vercel.app` del proyecto); una configuración incorrecta rompe el inicio de sesión solo en previews.
- **Pasos manuales fuera del código.** Crear el proyecto de Neon y la rama `preview`, el proyecto de Vercel con sus variables de entorno y región, la cuenta de Gmail con su contraseña de aplicación, y la protección de `main` en GitHub los hace el autor; el plan de tareas debe listarlos explícitamente.

## Cobertura
| RF | Módulo / decisión que lo cubre |
|---|---|
| RF-1 | `use-cases/register` → `auth.api.signUpEmail`; D8 |
| RF-2 | Hook de registro (D9); mensaje en `result` |
| RF-3 | `use-cases/register`, traducción de `USER_ALREADY_EXISTS` con enlace a `/recuperar`; D8 |
| RF-4 | `minPasswordLength: 8` en `auth` y esquema Zod de registro y cambio de contraseña |
| RF-5 | `requireEmailVerification: false` en `auth` |
| RF-6 | `auth`: `session.expiresIn` 30 días y `disableSessionRefresh` |
| RF-7 | `domain/login-lockout`, tabla `LoginFailure`, hooks de inicio de sesión; D10 |
| RF-8 | `use-cases/sign-out` → `auth.api.signOut` |
| RF-9 | `use-cases/request-password-reset` devuelve siempre el mismo mensaje |
| RF-10 | `auth` `sendResetPassword` → `server/email` |
| RF-11 | `resetPasswordTokenExpiresIn: 3600`; token de un solo uso de Better Auth; `use-cases/reset-password` |
| RF-12 | Rutas `(public)` sin componentes de acción; layout `(admin)` exige sesión |
| RF-13 [MODIFICADO] | `server/authz` en todos los casos de uso y rutas GET privadas, dueño o administrador; principio 3; D21 |
| RF-14 | `server/queries` sin campos de `user` en vistas públicas; E2E de visibilidad |
| RF-15 | `use-cases/create-league` |
| RF-16 | `domain/semester` y esquema Zod |
| RF-17 | `domain/semester` con "hoy" de `server/time` en el formulario de nueva liga |
| RF-18 | Índice único `(semester, nameKey)`; D2 |
| RF-19 | `domain/names` |
| RF-20 | `use-cases/update-league` con `mustBeInProgress` |
| RF-21 | Modelo `League.ownerId` sin límite |
| RF-22 | `/mis-ligas`, `queries/my-leagues` |
| RF-23 | `use-cases/create-team`, `delete-team`; `domain/league-rules` |
| RF-24 | `domain/league-rules` |
| RF-25 | `use-cases/update-team` |
| RF-26 | Índice único `(leagueId, nameKey)` de `Team`; D2 |
| RF-27 | `domain/names` |
| RF-28 | `server/crests`; D16 |
| RF-29 | `server/crests` (formato real por contenido, SVG y tamaño) |
| RF-30 | `server/crests` (256 px, WebP); ADR 007 |
| RF-31 | `components/crest` con inicial |
| RF-32 | `use-cases/set-team-crest`, `remove-team-crest` |
| RF-33 | `use-cases/create-player` |
| RF-34 | `use-cases/update-player` |
| RF-35 | Índice único `(leagueId, nameKey)` de `Player`; D2 |
| RF-36 | `domain/names` |
| RF-37 | `domain/league-rules` y FK `Goal.scorerId` con `restrict` |
| RF-38 | `use-cases/delete-player` |
| RF-39 | `use-cases/transfer-player` |
| RF-40 | `Goal.teamId` explícito; D5 |
| RF-41 | `domain/league-rules`; `use-cases/generate-matchday` |
| RF-42 | `domain/scheduling`; D6 |
| RF-43 | `domain/matchdays` (numeración derivada); D3 |
| RF-44 | `domain/scheduling`; D6 |
| RF-45 | `domain/scheduling` con primer partido de la fecha cronológicamente anterior; D6 |
| RF-46 | `use-cases/reorder-matches`; D17 |
| RF-47 | Modelo `Match` con `teamAId`/`teamBId` sin semántica de local; interfaz sin etiquetas |
| RF-48 | `domain/matchdays` (estado derivado); D3 |
| RF-49 | `domain/matches` permite jugar pendientes de fechas incompletas; `generate-matchday` no bloquea por incompletas |
| RF-50 | `use-cases/delete-matchday` (cascada, tablas recalculadas al leer) |
| RF-51 | `queries` cuenta partidos terminados para el AlertDialog |
| RF-52 | `/mis-ligas/[leagueId]/fechas/[matchdayId]`, `components/matchday` |
| RF-53 | `components/matchday` (Sheet con jugadores de ambos equipos y "Gol sin autor" por equipo); `use-cases/add-goal` |
| RF-54 | `use-cases/add-goal` persiste al instante; `useMutation` optimista (ADR 011) |
| RF-55 | `domain/matches` |
| RF-56 | `Goal.scorerId` nulo; `domain/standings` lo excluye de goleadores |
| RF-57 | `use-cases/remove-goal`, `reassign-goal`; `domain/matches` |
| RF-58 | `use-cases/finish-match` |
| RF-59 | `domain/standings` filtra partidos terminados |
| RF-60 | Tablas calculadas al leer (ADR 009); invalidación de consultas (ADR 011) |
| RF-61 | Pestañas de tabla y goleadores en la vista de la fecha, ruta GET `/tables` |
| RF-62 | `domain/standings`, `components/standings` |
| RF-63 | `domain/standings` |
| RF-64 | `domain/standings` |
| RF-65 | `domain/standings` |
| RF-66 | `domain/standings` |
| RF-67 | `use-cases/create-point-deduction` |
| RF-68 | `use-cases/update-point-deduction`, `delete-point-deduction` |
| RF-69 | `domain/standings` sin piso en cero; modelo sin límite por equipo |
| RF-70 | `components/standings` (asterisco y motivos) |
| RF-71 | `domain/standings` (goleadores con equipo actual) |
| RF-72 | `domain/standings` |
| RF-73 | `queries` cuenta pendientes; AlertDialog de finalizar liga |
| RF-74 | `use-cases/finalize-league` y `LeagueSnapshot`; D7 |
| RF-75 | `use-cases/finalize-league` en transacción |
| RF-76 | `server/authz` con `mustBeInProgress`; `domain/league-rules` |
| RF-77 | `use-cases/finalize-league` con tablas en cero |
| RF-78 | AlertDialog de eliminar liga |
| RF-79 | `use-cases/delete-league` (cascada con escudos) |
| RF-80 | `/`, `queries/home` agrupando por semestre |
| RF-81 | `/ligas/[leagueId]` en curso; D13 |
| RF-82 | `/ligas/[leagueId]` finalizada desde `LeagueSnapshot` |
| RF-83 | D13 |
| RF-84 | `use-cases/revert-match`; `domain/matches` |
| RF-85 | Escrituras sin control de versión (último cambio gana) |
| RF-86 | `revokeSessionsOnPasswordReset: true` |
| RF-87 | `use-cases/change-email`; D12 |
| RF-88 | `use-cases/change-email` (correo único) |
| RF-89 | `use-cases/change-password` → `auth.api.changePassword` con `revokeOtherSessions` |
| RF-90 | `use-cases/change-email`, `change-password` |
| RF-91 | `queries` cuenta ligas; AlertDialog en `/cuenta` |
| RF-92 | `use-cases/delete-account`; D12 |
| RF-93 [MODIFICADO] | Layout de `/mis-ligas/[leagueId]` redirige a `/ligas/[leagueId]` si no es dueño ni administrador; D21 |
| RF-94 | `queries/my-leagues` con `domain/semester` y "hoy" |
| RF-95 | `queries` cuenta jugadores; AlertDialog de eliminar equipo |
| RF-96 | `use-cases/delete-team` (cascada a jugadores y escudo) |
| RF-97 | Diálogo de generar fecha con "hoy" de `server/time` |
| RF-98 | `use-cases/update-matchday-date` |
| RF-99 | Índice único `(leagueId, playDate)` |
| RF-100 | `domain/league-rules`; `use-cases/generate-matchday` |
| RF-101 | AlertDialog de finalizar fecha con conteo de pendientes |
| RF-102 | `use-cases/finalize-matchday`; D4 |
| RF-103 | `domain/matches`; D4 |
| RF-104 | `domain/matchdays` |
| RF-105 | `domain/matchdays` |
| RF-106 | Diálogo posterior a `finalize-matchday` con enlace a finalizar liga |
| RF-107 | `domain/standings` |
| RF-108 | `/` con mensaje de lista vacía |
| RF-109 [AÑADIDO] | `server/authz` (`requireOwnedLeague` acepta administradores); D21 |
| RF-110 [AÑADIDO] | `queries/my-leagues` agrega las ligas de los demás para el administrador; D21 |
| RF-111 [AÑADIDO] | Layout de `/mis-ligas/[leagueId]` con el aviso; D21 |
| RF-112 [AÑADIDO] | `env` (`ADMIN_EMAILS`) y `server/authz`; D21 |

Todos los RF de la spec 001 tienen fila; no hay huecos.
