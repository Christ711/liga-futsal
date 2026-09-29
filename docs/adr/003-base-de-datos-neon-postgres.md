# ADR 003 - Base de datos Postgres en Neon

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
El volumen es muy bajo: hasta 5 ligas por semestre, 8 equipos y 20 jugadores por equipo (spec 001, Contexto), más unos 40 escudos de 256×256 px por semestre (RF-30). La app pasa 2 a 3 meses sin uso en vacaciones y debe seguir funcionando sola (spec 001, Contexto), con costo cero sin tarjeta (principio 7). La lectura pública debe verse en menos de 3 s (RNF-2) y los tests E2E necesitan una base separada de producción (principio 2).

## Opciones consideradas

### Opción A - Neon (Postgres serverless)
Postgres estándar; plan gratuito con 0,5 GB por proyecto y 100 CU-horas al mes. El cómputo se suspende tras 5 minutos sin uso y despierta con la siguiente consulta. Gana: sin tarjeta; al exceder límites fallan las escrituras o se suspende el cómputo, sin borrar datos ni cobrar; sin pausa ni borrado por inactividad en regiones vigentes; integración con Vercel y ramas de base de datos. Pierde: la primera consulta tras 5 minutos sin uso tarda más (despertar del cómputo); 0,5 GB de límite. Cambiarla: coste bajo (`pg_dump` y cambiar la URL de conexión).

### Opción B - Turso (libSQL/SQLite)
SQLite administrado; plan gratuito con 5 GB, 500 M lecturas y 10 M escrituras al mes, sin tarjeta, bases siempre disponibles. Gana: límites holgados, sin espera al despertar, tests con SQLite local. Pierde: menos tipos y funciones que Postgres, menos proveedores alternativos, condiciones del plan gratuito cambiantes y sin comportamiento documentado al exceder límites. Cambiarla: coste medio (migrar SQLite a Postgres).

### Opción C - Supabase
Postgres con autenticación y almacenamiento incluidos; 500 MB de base y 1 GB de archivos. Gana: resuelve también autenticación y escudos. Pierde: pausa proyectos gratuitos tras 7 días de poca actividad y exige reactivarlos a mano o mantener una tarea programada de consultas; más dependencia del proveedor. Cambiarla: coste bajo solo para la base; alto si se usan sus otros servicios.

Descartada sin desarrollar: Prisma Postgres, porque su plan gratuito mide 200.000 operaciones al mes y el consumo depende del tráfico público, que no se controla.

## Decisión
Neon con Postgres. Combina Postgres estándar, que el autor ya conoce y que se puede mover a otro proveedor con bajo costo, la garantía de no borrar datos al exceder límites y la ausencia de pausas por inactividad. El proyecto se crea en una región de AWS, nunca en las regiones de Azure en baja.

## Consecuencias
- El esquema y las consultas usan Postgres estándar, sin extensiones propias de Neon, para mantener la portabilidad.
- La primera visita tras 5 minutos sin uso paga el despertar del cómputo; se verifica en la medición de RNF-2.
- Las ramas de Neon quedan disponibles para CI y URLs de prueba; su uso concreto se decide en la ADR de entornos y CI.
- Con 0,5 GB, guardar escudos reducidos en la propia base es viable en espacio; se decide en la ADR de escudos.
- Revertir: `pg_dump` hacia otro Postgres y cambiar la URL de conexión.

## Revisar si...
- Neon introduce pausa o borrado por inactividad para proyectos gratuitos en la región usada, o exige tarjeta.
- El almacenamiento supera 0,25 GB (50% del límite).
- La medición de RNF-2 falla por el despertar del cómputo.
