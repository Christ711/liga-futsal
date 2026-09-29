# ADR 018 - Correos de prueba capturados con Mailpit

Fecha: 2026-09-29   Estado: Aceptada

## Contexto
El único correo de la app es el de recuperación de contraseña, enviado por SMTP (ADR 006; RF-10 y RF-11 de la spec 001). Los flujos principales llevan test E2E (principio 2) y CI y el desarrollo local usan servicios en contenedores (ADR 014). Los tests necesitan leer el link del correo sin enviar correos reales. Surgió como decisión D19 del plan 001 y aplica a todo el proyecto.

## Opciones consideradas

### Opción A - Mailpit como servidor SMTP de prueba
Mailpit corre como contenedor en local y como servicio del job de CI; la app le envía por SMTP igual que en producción y los tests leen los mensajes desde su API HTTP. Gana: ejerce el mismo camino SMTP que producción, interfaz web para revisar correos en local, cero costo. Pierde: un contenedor más. Cambiarla: coste bajo.

### Opción B - Transporte de prueba que escribe el correo en un archivo
En entornos de prueba el módulo de correo escribe el mensaje en disco y los tests lo leen. Gana: sin contenedor extra. Pierde: no prueba el envío SMTP y agrega una rama de código que solo existe en pruebas. Cambiarla: coste bajo.

### Opción C - Enviar correos reales a una casilla de prueba
Gana: prueba el proveedor real. Pierde: tests lentos, dependientes de red y de Gmail, con riesgo de bloqueo de la cuenta de producción por uso automatizado. Cambiarla: coste bajo.

## Decisión
Mailpit en local y en CI. Prueba el mismo camino SMTP de producción sin enviar correos reales ni agregar código exclusivo de pruebas.

## Consecuencias
- `docker-compose.yml` y el workflow de CI incluyen Mailpit; las variables SMTP de local y CI apuntan a él.
- Los E2E leen los correos con un helper que consulta la API de Mailpit.
- CI no detecta un bloqueo de la cuenta de Gmail de producción; eso sigue cubierto por la prueba manual de cada semestre (ADR 006).
- Revertir: apuntar las variables SMTP de prueba a otro servidor y reemplazar el helper.

## Revisar si...
- Mailpit deja de mantenerse.
- La app pasa a enviar correos por una API HTTP en vez de SMTP.
