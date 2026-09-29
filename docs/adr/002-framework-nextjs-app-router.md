# ADR 002 - Framework web Next.js con App Router

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
El código debe ser TypeScript (principio 7) y correr en Vercel (ADR 001). Las páginas públicas deben verse en menos de 3 s con "Slow 4G" (RNF-2), lo que pide HTML renderizado en servidor y poco JavaScript. Toda escritura se valida en el servidor (principio 3, RF-13). La vista de la fecha es interactiva y se usa en el celular: anotar un gol en 2 toques (RNF-1) y ver las tablas sin salir de ella (RF-61).

## Opciones consideradas

### Opción A - Next.js (App Router)
Framework React de Vercel. Las páginas son componentes de servidor por defecto y solo las partes interactivas envían JavaScript; las escrituras van por Server Actions o rutas de API. Gana: integración nativa con Vercel, el ecosistema React más grande (autenticación, UI, ejemplos). Pierde: es el más complejo de los tres (caché, límite servidor/cliente) y sus versiones mayores traen cambios de API. Cambiarla: coste alto; la lógica de dominio aislada se conserva.

### Opción B - SvelteKit
Renderizado en servidor con `load` para leer y `form actions` para escribir; compila a muy poco JavaScript. Gana: bundles más chicos, modelo más simple, formularios sin JavaScript. Pierde: ecosistema más chico, menos componentes de UI listos, lenguaje distinto de React. Cambiarla: coste alto.

### Opción C - React Router v7 en modo framework
React con `loaders` y `actions` por ruta y renderizado en servidor. Gana: reutiliza el ecosistema React con un modelo de datos más predecible. Pierde: en Vercel depende de un adaptador; menos integraciones listas; historial de cambios de nombre y de API. Cambiarla: coste alto.

## Decisión
Next.js con App Router (versión mayor vigente: 16). Funciona sin adaptadores en Vercel, es React con el mayor ecosistema y es la preferencia del autor. Su complejidad se acota usando solo lo necesario: componentes de servidor para leer y renderizar, Server Actions o rutas de API para escribir, y componentes cliente solo donde haya interacción.

## Consecuencias
- Las páginas públicas se renderizan en servidor y envían JavaScript solo para sus partes interactivas.
- Las escrituras se ejecutan en el servidor, donde se aplica la autorización del principio 3.
- Queda abierto a las librerías del ecosistema React y Next.js para autenticación, UI y formularios.
- Seguir las versiones mayores de Next.js puede exigir migraciones; mantener la lógica de dominio fuera del framework (decisión 8) reduce ese costo.
- Revertir: reescribir UI y enrutamiento en otro framework.

## Revisar si...
- Una versión mayor de Next.js rompe la app y la migración cuesta más que cambiar de framework.
- Vercel deja de ser el host (ADR 001).
- La medición de RNF-2 no se cumple aun reduciendo el JavaScript enviado.
