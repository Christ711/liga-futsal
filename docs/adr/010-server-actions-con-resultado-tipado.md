# ADR 010 - Mutaciones por Server Actions con resultado tipado

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La spec 001 exige mensajes concretos ante rechazos esperables: código de invitación incorrecto (RF-2), contraseña corta (RF-4), nombres duplicados (RF-18, RF-26, RF-35), jugador con goles (RF-37), menos de 3 equipos (RF-41), día de juego repetido (RF-99) y fecha abierta (RF-100). Toda escritura se valida en el servidor (principio 3) y pasa por un caso de uso (ADR 008). En producción, Next.js reemplaza el mensaje de cualquier error lanzado desde el servidor por un identificador genérico (ADR 002).

## Opciones consideradas

### Opción A - Server Actions que devuelven un resultado tipado
Cada acción valida su entrada con un esquema y llama al caso de uso; devuelve `{ ok: true, data }` o `{ ok: false, error: { code, message, fields? } }`. Solo los errores inesperados se lanzan, se registran y se muestran como mensaje genérico. Gana: los mensajes de la spec llegan intactos, tipos de punta a punta sin escribir una API, rechazos verificables por `code` en los tests. Pierde: las acciones solo sirven a la propia app; exige disciplina para no lanzar en rechazos esperables. Cambiarla: coste medio.

### Opción B - Rutas de API REST con JSON
El cliente llama con `fetch` a rutas HTTP; los errores usan códigos HTTP con cuerpo `{ code, message }`. Gana: contrato estándar reutilizable por otros clientes. Pierde: rutas, cliente y serialización escritos y tipados a mano para una app sin otros clientes. Cambiarla: coste medio.

### Opción C - Server Actions que lanzan excepciones
Los rechazos se lanzan y los capturan los error boundaries. Gana: menos código. Pierde: en producción los mensajes se reemplazan por uno genérico, lo que incumple RF-2, RF-18 y el resto de RF con mensaje. Cambiarla: coste medio.

## Decisión
Server Actions que devuelven un resultado tipado. Es la única opción que entrega los mensajes de la spec sin construir una API que nadie más consume.

## Consecuencias
- Toda Server Action valida su entrada con un esquema Zod antes de llamar al caso de uso; la validación del servidor es la que cuenta, aunque el formulario también valide.
- Los rechazos esperables se devuelven como `{ ok: false, error }` con un `code` estable en inglés y un `message` en español para mostrar; nunca se lanzan.
- Los errores inesperados se lanzan, quedan en los logs del servidor y el usuario ve un mensaje genérico en español.
- Los tests verifican cada rechazo por su `code`, no por el texto del mensaje.
- Las rutas de Better Auth (`/api/auth/*`) quedan fuera de este contrato; sus errores se traducen en la interfaz a los mismos mensajes en español.
- Revertir: exponer los casos de uso mediante rutas de API; los casos de uso no cambian.

## Revisar si...
- Aparece un cliente distinto de la propia app web (por ejemplo, una app móvil), que necesitaría una API HTTP.
- Next.js cambia el comportamiento de las Server Actions de forma que el resultado tipado deje de llegar intacto al cliente.
