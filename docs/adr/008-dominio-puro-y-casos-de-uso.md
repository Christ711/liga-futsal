# ADR 008 - Dominio puro y casos de uso delgados

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La spec 001 tiene reglas con muchos casos: orden y numeración de fechas (RF-43 a RF-45), desempates (RF-65, RF-66, RF-107), estados de fechas y bloqueo de partidos (RF-48, RF-49, RF-100 a RF-105), validaciones de nombres (RF-18, RF-26, RF-35) y reglas de borrado (RF-37). Toda regla de dominio nueva llega con un test unitario (principio 2), toda escritura se autoriza en el servidor (principio 3) y Next.js puede cambiar su API entre versiones mayores (ADR 002).

## Opciones consideradas

### Opción A - Dominio puro y casos de uso delgados
Un módulo de dominio en TypeScript puro, sin dependencias de Next.js, Prisma ni Better Auth, contiene las reglas. Una capa de casos de uso verifica sesión y dueño, carga datos con Prisma, aplica el dominio y persiste. Las Server Actions y las páginas solo llaman a casos de uso. Gana: reglas testeables con tests unitarios rápidos y sin base; sobreviven a cambios de framework u ORM. Pierde: una capa más y conversión entre datos de Prisma y del dominio. Cambiarla: coste medio.

### Opción B - Lógica dentro de las Server Actions
Cada acción valida, consulta y aplica reglas en el mismo lugar. Gana: menos archivos. Pierde: testear una regla exige base y contexto de Next.js; reglas acopladas al framework y duplicadas entre acciones. Cambiarla: coste alto.

### Opción C - Arquitectura hexagonal completa
Entidades, puertos de repositorio, adaptadores de Prisma e inyección de dependencias. Gana: máximo aislamiento. Pierde: ceremonia desproporcionada para un desarrollador y unas 15 operaciones. Cambiarla: coste medio.

## Decisión
Dominio puro y casos de uso delgados. Ubica las reglas más delicadas donde el principio 2 las cubre con tests unitarios baratos, sin interfaces ni contenedores de dependencias.

## Consecuencias
- El módulo de dominio no importa Next.js, React, Prisma, Better Auth ni nada con efectos (red, base, reloj); recibe la fecha actual como parámetro cuando la necesita.
- Cada operación de escritura de la spec es un caso de uso que, en este orden: obtiene la sesión, verifica que el ayudante es dueño de la liga, carga datos, aplica reglas del dominio y persiste en una transacción cuando toca varias tablas.
- Server Actions, rutas de API y páginas no contienen reglas de negocio ni llaman a Prisma directamente para escribir.
- Las reglas del dominio se cubren con tests unitarios; los casos de uso y la autorización se cubren con tests E2E o de integración contra una base real.
- Revertir: mover las reglas dentro de las acciones; no hay dependencias que deshacer.

## Revisar si...
- Aparece una regla de dominio que no puede expresarse sin acceso a la base dentro de una sola operación.
- Los casos de uso se vuelven pasamanos vacíos para la mayoría de las operaciones, señal de que la capa sobra.
