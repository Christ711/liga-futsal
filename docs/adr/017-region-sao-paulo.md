# ADR 017 - Región São Paulo para la base y las funciones

Fecha: 2026-09-29   Estado: Aceptada

## Contexto
Todos los usuarios están en Chile y la tabla pública debe verse en menos de 3 s con "Slow 4G" (RNF-2 de la spec 001). Cada petición dinámica ejecuta una función de Vercel que consulta Neon (ADR 001, ADR 003), así que la distancia entre usuario, función y base se paga en cada visita. El plan Hobby permite una sola región de funciones y Neon ofrece `aws-sa-east-1` (São Paulo). Surgió como decisión D18 del plan 001 y aplica a todo el proyecto.

## Opciones consideradas

### Opción A - São Paulo en ambos: Neon `aws-sa-east-1` y Vercel `gru1`
Función y base en la misma zona, la más cercana a Chile en ambos proveedores. Gana: menor latencia desde Chile y consultas entre función y base dentro de la misma región. Pierde: nada relevante para usuarios en Chile. Cambiarla: coste medio (mover la base exige migrar el proyecto de Neon).

### Opción B - Regiones por defecto en Estados Unidos (`iad1` y `aws-us-east-1`)
Gana: sin configuración. Pierde: suma del orden de 150 ms de ida y vuelta desde Chile por petición. Cambiarla: coste medio.

### Opción C - Funciones en São Paulo y base en Estados Unidos
Gana: primera respuesta de la función más cerca del usuario. Pierde: cada consulta cruza el continente, lo que es peor que B cuando una página hace varias consultas. Cambiarla: coste medio.

## Decisión
Neon en `aws-sa-east-1` y funciones de Vercel en `gru1`: es la combinación más cercana a Chile y mantiene función y base juntas.

## Consecuencias
- `vercel.json` fija `regions: ["gru1"]`.
- El proyecto de Neon y su rama `preview` se crean en `aws-sa-east-1`.
- Revertir: cambiar la región en `vercel.json` y migrar la base a un proyecto de Neon en otra región con `pg_dump`.

## Revisar si...
- Neon o Vercel retiran la región de São Paulo o cambian su disponibilidad en planes gratuitos.
- La app empieza a tener usuarios mayoritariamente fuera de Sudamérica.
