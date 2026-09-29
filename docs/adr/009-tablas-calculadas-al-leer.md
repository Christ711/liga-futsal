# ADR 009 - Tablas calculadas al leer y snapshot solo al finalizar

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La tabla de posiciones y la de goleadores deben reflejar cada partido terminado, gol corregido, partido devuelto a pendiente o fecha eliminada (RF-50, RF-60, RF-84), descontar puntos (RF-64) y excluir partidos pendientes (RF-59). Al finalizar la liga se congelan y se borran fechas, partidos y goles (RF-74, RF-75). El problema de origen del proyecto son fórmulas que se rompían y dejaban tablas incorrectas (spec 001, Contexto). Volumen máximo por liga: unos 420 partidos y 2.000 goles.

## Opciones consideradas

### Opción A - Calcular al leer y guardar solo el snapshot final
Una función pura del dominio calcula ambas tablas en cada lectura a partir de partidos terminados, goles y descuentos; al finalizar la liga, su resultado se guarda como snapshot. Gana: las tablas no pueden desincronizarse; una sola función que testear. Pierde: cálculo en cada visita, del orden de microsegundos con este volumen. Cambiarla: coste bajo.

### Opción B - Tablas guardadas y actualizadas en cada escritura
Cada operación que cambia resultados actualiza filas de posiciones y goleadores. Gana: lecturas triviales. Pierde: cada operación debe actualizar bien las tablas y un error deja la tabla pública incorrecta sin aviso, el mismo fallo del Excel original. Cambiarla: coste medio.

## Decisión
Calcular al leer con una función pura del dominio y persistir solo el snapshot al finalizar la liga. Con este volumen el cálculo es gratis y elimina por diseño la desincronización.

## Consecuencias
- No existen tablas de posiciones ni de goleadores persistidas mientras la liga está en curso; RF-50, RF-60 y RF-84 se cumplen sin código de recálculo.
- La misma función produce la tabla de la vista pública, la de la vista de la fecha (RF-61) y el snapshot final (RF-74).
- El snapshot guarda los valores ya calculados de ambas tablas, con descuentos y motivos y el equipo de cada goleador; una liga finalizada se muestra solo desde el snapshot.
- La finalización calcula el snapshot, lo guarda y borra fechas, partidos y goles en una sola transacción (ADR 004).
- Revertir: agregar tablas persistidas actualizadas por los casos de uso.

## Revisar si...
- La medición de RNF-2 muestra que el cálculo de tablas es el cuello de botella.
- Una spec futura pide estadísticas históricas que exigen agregar sobre muchas ligas a la vez.
