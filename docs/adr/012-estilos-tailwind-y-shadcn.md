# ADR 012 - Estilos con Tailwind CSS v4 y componentes shadcn/ui

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La app se usa principalmente en el celular, sin desplazamiento horizontal desde 360 px (RNF-3), y las páginas públicas deben cargar en menos de 3 s con "Slow 4G" (RNF-2). La spec exige diálogos de confirmación (RF-51, RF-73, RF-78, RF-91, RF-95, RF-101), elegir jugador en una lista (RF-53) y tablas legibles en pantallas angostas (RF-62, RF-71). La interfaz está en español (principio 6).

## Opciones consideradas

### Opción A - Tailwind CSS v4 y shadcn/ui
CSS utilitario generado en el build, sin costo en tiempo de ejecución; shadcn/ui copia al repo componentes accesibles basados en Radix que quedan como código propio. Gana: CSS estático en páginas públicas, componentes accesibles listos para diálogos y selectores, código editable, estándar del ecosistema Next.js. Pierde: marcado cargado de clases; los componentes copiados no reciben actualizaciones automáticas. Cambiarla: coste alto.

### Opción B - CSS Modules y componentes propios
CSS por componente nativo de Next.js y componentes escritos desde cero. Gana: cero dependencias, CSS estático. Pierde: diálogos, selectores y avisos accesibles construidos a mano, con alto riesgo de errores de foco y teclado. Cambiarla: coste alto.

### Opción C - Librería de componentes completa (por ejemplo, Mantine)
Componentes listos con sistema de estilos propio. Gana: rapidez para armar pantallas. Pierde: más JavaScript y CSS en todas las páginas, incluidas las públicas; aspecto y API ligados a las versiones de la librería. Cambiarla: coste alto.

## Decisión
Tailwind CSS v4 y componentes de shadcn/ui. CSS estático para las páginas públicas y componentes accesibles para los diálogos y selectores que pide la spec, sin depender de una librería de componentes en tiempo de ejecución.

## Consecuencias
- Los estilos se escriben con clases de Tailwind y se diseñan primero para 360 px de ancho.
- Los componentes de shadcn/ui se agregan al repo solo cuando una pantalla los necesita y se editan como código propio; sus textos se escriben en español.
- Los componentes interactivos de Radix (diálogo, select) solo cargan JavaScript en las pantallas que los usan; las páginas públicas usan componentes de servidor sin ellos siempre que sea posible.
- Las tablas de posiciones y goleadores se diseñan para caber en 360 px sin desplazamiento horizontal de la página (RNF-3).
- Revertir: reescribir el marcado y los estilos de todas las pantallas.

## Revisar si...
- Una versión mayor de Tailwind obliga a reescribir una parte importante de los estilos.
- Radix o shadcn/ui dejan de mantenerse y un componente usado presenta un problema de accesibilidad o seguridad sin corrección.
