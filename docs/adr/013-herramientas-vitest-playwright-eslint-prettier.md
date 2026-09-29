# ADR 013 - Herramientas de test, lint y formato: Vitest, Playwright, ESLint y Prettier

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
Toda regla de dominio lleva un test unitario y todo flujo principal un test E2E, y nada se integra sin lint, unitarios y E2E en verde en CI (principio 2). El código es TypeScript (principio 7). El dominio es TypeScript puro y se testea sin Next.js (ADR 008). La spec pide E2E en un viewport de 360 px y medir RNF-2 con red "Slow 4G" y CPU 4 veces más lenta (spec 001, RNF-2 y criterios de finalización).

## Opciones consideradas

### Opción A - Vitest, Playwright, ESLint y Prettier
Vitest para unitarios; Playwright para E2E con emulación de celular y limitación de red y CPU; ESLint con la configuración oficial de Next.js; Prettier con el plugin que ordena clases de Tailwind. Gana: estándar del ecosistema, reglas de Next.js para errores del framework y de rendimiento, una sola herramienta para E2E y para medir RNF-2. Pierde: dos herramientas para lint y formato, más configuración y dependencias. Cambiarla: coste bajo.

### Opción B - Vitest, Playwright y Biome
Los mismos tests; Biome reemplaza a ESLint y Prettier. Gana: una herramienta, menos configuración, mucha velocidad. Pierde: sin reglas específicas de Next.js, reglas de hooks menos maduras, orden de clases de Tailwind experimental. Cambiarla: coste bajo.

### Opción C - Jest, Cypress, ESLint y Prettier
La combinación clásica. Gana: muy conocida. Pierde: Jest necesita configuración extra para TypeScript y ESM; Cypress es más lento en CI, con funciones de pago en su nube, y limita peor red y CPU. Cambiarla: coste bajo.

## Decisión
Vitest (versión mayor 5) para tests unitarios, Playwright para tests E2E y la medición de RNF-2, ESLint con la configuración oficial de Next.js y Prettier con el plugin de Tailwind. Las reglas oficiales de Next.js detectan errores del framework y de rendimiento, y Playwright resuelve E2E y medición con una sola herramienta.

## Consecuencias
- Los tests unitarios del dominio corren con Vitest sin base de datos ni Next.js.
- Los tests E2E corren con Playwright en Chromium con viewport de 360 px contra la app construida para producción y una base real de pruebas (la base concreta la fija la ADR de entornos y CI).
- RNF-2 se mide con un test de Playwright que limita la red a 150 ms de latencia y 1,6 Mbps y la CPU a 4 veces más lenta, con caché vacía.
- ESLint se fija en la versión mayor 9: `eslint-config-next` 16.3 depende de `eslint-plugin-react` 7.37.5, que no es compatible con ESLint 10. Es una herramienta de desarrollo que no llega a producción.
- ESLint y Prettier corren en CI y un error de cualquiera de los dos bloquea el merge; Prettier no se discute en revisión, se aplica.
- Los comandos concretos se registran en `AGENTS.md`.
- Revertir: reemplazar herramientas sin tocar el código de la app; los tests se reescriben en la sintaxis de la nueva herramienta.

## Revisar si...
- `eslint-config-next` publica una versión compatible con ESLint 10 (entonces se sube ESLint a la 10).
- Next.js publica sus reglas de lint para otra herramienta o deja de mantener su configuración de ESLint.
- Los E2E en CI superan 10 minutos por ejecución.
