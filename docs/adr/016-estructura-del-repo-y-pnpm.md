# ADR 016 - Estructura del repositorio por capas y gestor de paquetes pnpm

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
El dominio no puede importar Next.js, Prisma, Better Auth ni módulos con efectos (ADR 008), y esa frontera debe verificarse con una regla de lint y no por disciplina. El repositorio contiene una sola app Next.js en Vercel (ADR 001, ADR 002) con casos de uso de servidor (ADR 008), rutas de lectura (ADR 011), componentes de shadcn/ui (ADR 012), tests unitarios y E2E (ADR 013) y el esquema de Prisma con sus migraciones (ADR 004).

## Opciones consideradas

### Opción A - Una app con capas arriba y funcionalidades dentro
`prisma/` para esquema y migraciones; `src/app/` para rutas; `src/domain/` para reglas puras con sus tests al lado; `src/server/` para casos de uso e integraciones; `src/components/` para UI; `tests/e2e/` para Playwright. Gana: la frontera del dominio es una sola carpeta, verificable con una regla de ESLint; estructura cercana a la convención de Next.js. Pierde: el código de una funcionalidad queda repartido entre capas. Cambiarla: coste bajo a medio.

### Opción B - Carpetas por funcionalidad
`src/features/<funcionalidad>/` con dominio, casos de uso, acciones y componentes juntos. Gana: todo lo de una funcionalidad está junto. Pierde: la frontera del dominio depende de patrones de nombre más frágiles; funcionalidades transversales como las tablas no encajan en una sola carpeta. Cambiarla: coste bajo a medio.

### Opción C - Monorepo con paquetes
`packages/domain` y `apps/web` con workspaces. Gana: frontera del dominio aplicada por el gestor de paquetes. Pierde: configuración de workspaces, builds y rutas de TypeScript desproporcionada para una sola app. Cambiarla: coste medio.

## Decisión
Una sola app con capas en el nivel superior y funcionalidades dentro de cada capa, gestionada con pnpm 10. La frontera del dominio queda en una sola carpeta verificable por lint, sin la ceremonia de un monorepo; pnpm es más rápido en CI y no permite importar dependencias no declaradas. Se fija la versión mayor 10 porque es la última que Vercel soporta de forma nativa; las versiones 11 y 12 solo funcionan en Vercel activando Corepack con una opción experimental, lo que es un riesgo para una app que funciona sola.

## Consecuencias
- Estructura:

  ```
  prisma/                 schema.prisma y migraciones
  src/
    app/                  rutas de Next.js: (public), (admin), api/
    domain/               reglas puras, con sus *.test.ts al lado
    server/
      use-cases/          un archivo por operación de escritura de la spec
      db/                 cliente de Prisma
      auth/               configuración de Better Auth y hooks
      email/              módulo de correo (ADR 006)
      crests/             validación y procesamiento de escudos (ADR 007)
      time/               "hoy" y "semestre actual" (ADR 015)
    components/
      ui/                 componentes de shadcn/ui
      <funcionalidad>/    componentes de la app
  tests/e2e/              tests de Playwright
  ```

- Una regla de ESLint prohíbe que `src/domain` importe cualquier módulo fuera de `src/domain`, salvo la biblioteca estándar de TypeScript.
- Una regla de ESLint prohíbe importar `src/server` desde componentes cliente.
- El lockfile de pnpm se versiona y no se edita a mano; CI instala con lockfile congelado.
- La versión de pnpm y la de Node se fijan en `package.json` (`packageManager` y `engines`).
- Revertir: mover archivos y actualizar importaciones y reglas de lint.

## Revisar si...
- Vercel soporta de forma nativa una versión mayor de pnpm posterior a la 10.
- Aparece un segundo artefacto desplegable (otra app o un servicio) que comparta el dominio, lo que justificaría un monorepo.
- Las funcionalidades crecen tanto que recorrer capas para un cambio pequeño se vuelve la queja habitual.
