# ADR 011 - TanStack Query solo en las vistas autenticadas interactivas

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La vista de la fecha es la única pantalla muy interactiva: se anotan goles seguidos en 2 toques (RNF-1), se terminan y devuelven partidos (RF-58, RF-84) y se consultan las tablas sin salir de ella (RF-61). El resto de la administración son formularios simples. Las páginas públicas deben verse en menos de 3 s con "Slow 4G" (RNF-2) y se renderizan en el servidor (ADR 002). Las escrituras usan Server Actions con resultado tipado (ADR 010) sobre casos de uso (ADR 008). El autor ya usa TanStack Query en otros proyectos Next.js.

## Opciones consideradas

### Opción A - Solo React y Next.js nativos
Lecturas en componentes de servidor; mutaciones con Server Actions, `useActionState` o `useTransition`, `useOptimistic` y `revalidatePath`. Gana: cero dependencias, una sola fuente de verdad, sin rutas de lectura extra. Pierde: optimismo con varios goles seguidos y reversión más artesanal; estado de cada mutación manejado a mano. Cambiarla: coste bajo.

### Opción B - TanStack Query solo en vistas autenticadas interactivas
Las páginas públicas siguen como componentes de servidor puros. En la vista de la fecha y la administración de la liga, los datos se precargan en el servidor y se hidratan en la caché de TanStack Query; las mutaciones usan `useMutation` sobre las Server Actions con actualización optimista y reversión, e invalidan las consultas afectadas. Requiere algunas rutas GET de lectura. Gana: patrón conocido por el autor, estados de mutación uniformes, optimismo robusto, invalidación declarativa. Pierde: una dependencia y unos 13 KB de JavaScript en vistas autenticadas; dos cachés que coordinar; rutas GET que autorizar y testear. Cambiarla: coste bajo a medio.

### Opción C - TanStack Query en toda la app
Todas las lecturas pasan por rutas GET y TanStack Query, incluidas las públicas. Gana: un único patrón. Pierde: las páginas públicas cargan más JavaScript y arman los datos en el navegador, en contra de RNF-2 y de ADR 002; casi toda la lectura se duplica como API. Cambiarla: coste medio.

## Decisión
TanStack Query (versión mayor 5) solo en las vistas autenticadas interactivas. Aporta donde hay mutaciones rápidas, optimistas y con reversión, es conocido por quien mantiene el código, y dejarlo fuera de las páginas públicas preserva RNF-2.

## Consecuencias
- Ninguna página pública importa TanStack Query ni su proveedor; el proveedor se monta solo en el layout de las vistas autenticadas.
- La carga inicial de las vistas autenticadas se hace en el servidor y se hidrata en la caché, sin una petición extra al abrir la página.
- Cada `mutationFn` llama a una Server Action y convierte `{ ok: false, error }` en un error que conserva `code` y `message` (ADR 010).
- Registrar, quitar o reasignar un gol, terminar o devolver un partido y finalizar una fecha invalidan las consultas de la fecha y de las tablas.
- Las lecturas desde el cliente usan rutas GET propias, nunca Server Actions; esas rutas verifican sesión y dueño igual que los casos de uso (principio 3) y devuelven datos del mismo cálculo del dominio (ADR 009).
- Tras una mutación, la fuente de verdad en las vistas autenticadas es la caché de TanStack Query; las páginas públicas se actualizan al recargar (RF-83).
- Revertir: reemplazar `useMutation` y `useQuery` por `useActionState`, `useOptimistic` y `revalidatePath`, y retirar las rutas GET.

## Revisar si...
- La coordinación entre la caché de Next.js y la de TanStack Query produce datos desactualizados que no se resuelven invalidando consultas.
- React o Next.js incorporan un mecanismo nativo que cubra mutaciones optimistas con reversión e invalidación con menos código.
