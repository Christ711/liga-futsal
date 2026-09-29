# ADR 007 - Escudos guardados en Postgres y servidos con caché de CDN

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
Cada equipo puede tener un escudo PNG, JPG o WebP de hasta 2 MB, validado por su contenido real y reducido a un máximo de 256×256 px (RF-28 a RF-30). Se reemplaza o se quita (RF-32), se borra junto con su equipo, liga o cuenta (RF-79, RF-92, RF-96) y se conserva al finalizar la liga (RF-74). Aparece en tablas públicas que deben cargar en menos de 3 s (RNF-2). El volumen es de unos 40 escudos por semestre, alrededor de 1 MB. Costo cero (principio 7) y pocas piezas externas.

## Opciones consideradas

### Opción A - Columna binaria en Postgres
El escudo procesado se guarda en la base junto a su equipo y una ruta del servidor lo entrega con URL versionada y caché permanente; la CDN de Vercel lo sirve desde caché y solo consulta la base la primera vez. Gana: cero servicios nuevos, borrado en la misma transacción que equipo, liga o cuenta, sin archivos huérfanos, tests E2E sin simular otro servicio. Pierde: la primera petición de cada escudo ejecuta una función y puede despertar la base; no escala a volúmenes grandes. Cambiarla: coste bajo (script de migración y cambio de ruta).

### Opción B - Vercel Blob público
El escudo se sube a Blob y la base guarda su URL; el navegador lo pide directo a la CDN. Hobby incluye 1 GB, 10.000 lecturas sin caché, 2.000 escrituras y 10 GB de transferencia al mes; si se exceden, se bloquea 30 días sin cobrar. Gana: los escudos no pasan por funciones ni base. Pierde: un servicio y un token más; borrar en Blob y en la base no es atómico; si Blob se bloquea, desaparecen los escudos. Cambiarla: coste bajo.

## Decisión
Columna binaria en Postgres, servida por una ruta con URL versionada y caché permanente de CDN. Con alrededor de 1 MB por semestre, la ventaja de sacar archivos de la base no aplica, y a cambio se elimina un servicio y los borrados quedan atómicos.

## Consecuencias
- El servidor valida el contenido real del archivo, lo reduce a 256 px como máximo conservando la proporción y lo recodifica como WebP antes de guardarlo; así se descartan metadatos y contenido incrustado (RF-29, RF-30).
- La URL de cada escudo incluye una versión derivada de su contenido; al reemplazarlo cambia la URL, por lo que la caché permanente nunca sirve una versión vieja.
- Los escudos no pasan por la optimización de imágenes de Vercel (ya están reducidos), para no consumir su cuota del plan Hobby.
- Borrar un equipo, una liga o una cuenta borra sus escudos en la misma transacción.
- Revertir: mover los binarios a un almacenamiento de archivos con un script y cambiar la ruta que los sirve.

## Revisar si...
- Los escudos superan 50 MB en total o el tamaño de la base se acerca al 50% del límite de Neon.
- La medición de RNF-2 muestra que servir escudos desde la base es el cuello de botella.
