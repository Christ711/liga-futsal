# ADR 015 - Zona horaria fija America/Santiago y días sin hora

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
El día actual se propone como día de juego (RF-97), el semestre sugerido depende del mes (RF-17) y el aviso de semestre terminado usa ese mismo corte (RF-94). No puede haber dos fechas el mismo día (RF-99) y las fechas se numeran por orden cronológico de su día (RF-43). Todos los usuarios están en Chile (UTC-4 en invierno, UTC-3 en verano), mientras las funciones de Vercel corren en UTC (ADR 001). El dominio recibe la fecha actual como parámetro (ADR 008).

## Opciones consideradas

### Opción A - Zona fija America/Santiago y días sin hora
El día de juego se guarda como fecha de calendario sin hora (tipo `date`); "hoy" y "semestre actual" se calculan en el servidor con la zona `America/Santiago` en un único módulo y se pasan al dominio. Gana: el día mostrado es el guardado, horario de verano resuelto por la base de zonas horarias, dominio testeable. Pierde: la app queda ligada a Chile. Cambiarla: coste bajo.

### Opción B - Zona horaria del navegador
El cliente envía "hoy" según su reloj. Gana: cada usuario ve su día. Pierde: el servidor confía en un dato del cliente que puede estar mal configurado o manipulado; tests dependientes del reloj local. Cambiarla: coste bajo.

### Opción C - Todo en UTC
"Hoy" es el día UTC del servidor. Gana: nada que configurar. Pierde: desde las 20:00 o 21:00 de Chile el día UTC ya es el siguiente, así que se propondría el día equivocado y los cortes de semestre se correrían. Cambiarla: coste bajo.

## Decisión
Zona fija `America/Santiago` y días de juego guardados como fecha sin hora. Es la única opción que propone el día correcto a cualquier hora en Chile sin depender del reloj del cliente.

## Consecuencias
- El día de juego es una columna `date` de Postgres; nunca se guarda como fecha con hora ni se convierte entre zonas.
- Un único módulo de servidor obtiene "hoy" y "semestre actual" en `America/Santiago`; ningún otro código lee el reloj para esos fines.
- El dominio recibe "hoy" como parámetro, de modo que los tests unitarios fijan cualquier día, incluidos los bordes de semestre (31 de julio y 1 de agosto) y los cambios de horario.
- Las marcas de tiempo técnicas (sesiones, tokens, intentos fallidos) siguen en UTC con zona (`timestamptz`), porque miden duraciones y no días de calendario.
- Revertir: cambiar el módulo de "hoy" para que use otra zona o una configurable.

## Revisar si...
- La app empieza a usarse fuera de Chile.
- Una spec futura necesita horas de partido, no solo días.
