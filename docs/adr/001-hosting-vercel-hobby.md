# ADR 001 - Hosting en Vercel Hobby

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La app debe estar en producción varios semestres funcionando sola en el día a día, con su autor atendiendo solo errores puntuales (spec 001, Contexto) y con costo cero sin tarjeta (principio 7). Las páginas públicas deben verse en menos de 3 s con "Slow 4G" (RNF-2), lo que pide renderizado en servidor, y los escudos se reducen en el servidor (RF-30). Todo cambio entra por PR con CI (principio 2). El tráfico esperado es muy bajo: hasta 5 ligas por semestre.

## Opciones consideradas

### Opción A - Vercel Hobby
Despliegue desde GitHub: cada merge a `main` publica en producción y cada PR obtiene una URL de prueba. Incluye al mes 1.000.000 de invocaciones, 100 GB de transferencia, 4 h de CPU activa y 100 deploys al día. Gana: integración nativa con Next.js, sin tarjeta, al exceder límites se pausa en vez de cobrar, previews por PR, sin política de borrado por inactividad documentada. Pierde: uso restringido a personal y no comercial, logs de 1 hora, proyecto ligado a una cuenta personal. Cambiarla: coste bajo a medio.

### Opción B - Cloudflare Workers (plan gratuito)
Next.js sobre el runtime de Workers mediante un adaptador. 100.000 peticiones al día, 10 ms de CPU por petición, 128 MB de memoria. Gana: límites de tráfico holgados, sin restricción comercial. Pierde: 10 ms de CPU no alcanzan para procesar imágenes (RF-30) y quedan justos para renderizar; depende de un adaptador que Cloudflare ya está reemplazando (OpenNext por vinext). Cambiarla: coste medio por las APIs propias del runtime.

### Opción C - Netlify Free
300 créditos al mes con tope duro; cada deploy a producción cuesta 15 créditos (unos 20 deploys al mes). Gana: sin tarjeta, pausa en vez de cobrar. Pierde: el tope de deploys choca con un flujo de un PR por tarea; soporte de Next.js menos directo. Cambiarla: coste bajo a medio.

## Decisión
Vercel Hobby. Es la única opción que cumple a la vez costo cero sin tarjeta, Next.js sin adaptadores, procesamiento de imágenes en el servidor y previews por PR. La restricción no comercial se cumple: es una liga interna de un curso universitario, sin cobros ni publicidad.

## Consecuencias
- Producción se publica automáticamente desde `main`; cada PR tiene una URL de prueba.
- Los secretos (código de invitación, credenciales) se configuran como variables de entorno del proyecto en Vercel (principio 5).
- Si se exceden los límites, la app queda pausada hasta 30 días; no se cobra.
- El proyecto vive en la cuenta personal del autor, que sigue a cargo del mantenimiento ante errores después de su egreso; no se prevé transferirlo.
- Revertir: mover la app a otro host compatible con Next.js y reconfigurar variables de entorno y dominio.

## Revisar si...
- Vercel cambia las condiciones del plan Hobby (exige tarjeta, borra proyectos inactivos o reduce límites por debajo del uso real).
- La app pasa a tener uso comercial (cobro de inscripciones, publicidad).
- El uso real supera el 50% de algún límite mensual del plan.
