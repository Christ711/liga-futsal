# ADR 006 - Envío de correo por SMTP de una cuenta de Gmail dedicada

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
El único correo que envía la app es el link de recuperación de contraseña (RF-10), con un volumen de pocos correos al mes. Debe tener costo cero sin tarjeta (principio 7). La app vive en un subdominio `*.vercel.app` (ADR 001), donde no se pueden agregar registros DNS, y el autor no tiene dominio propio. Los servicios de correo transaccional exigen un dominio verificado para enviar a destinatarios arbitrarios con buena entrega.

## Opciones consideradas

### Opción A - Cuenta de Gmail dedicada por SMTP
Una cuenta de Gmail solo para la app, con verificación en dos pasos y contraseña de aplicación; el servidor envía por el SMTP de Gmail con un cliente SMTP estándar. Gana: costo cero sin dominio ni tarjeta, buena entrega porque sale de Gmail, unos 500 correos al día. Pierde: remitente `@gmail.com`; depende de que Google mantenga las contraseñas de aplicación y no bloquee la cuenta. Cambiarla: coste bajo (credenciales y host SMTP).

### Opción B - Brevo, plan gratuito
300 correos al día por API o SMTP, sin tarjeta, con remitente individual verificado. Gana: servicio transaccional con registros y panel. Pierde: enviar como `@gmail.com` desde servidores ajenos falla SPF y DMARC y arriesga spam o rechazo; una cuenta más. Cambiarla: coste bajo.

### Opción C - Resend, plan gratuito
3.000 correos al mes, sin tarjeta, API simple. Gana: la mejor experiencia de desarrollo. Pierde: sin dominio propio verificado solo envía al correo del titular; comprar un dominio viola el principio 7. Cambiarla: coste bajo.

## Decisión
Cuenta de Gmail dedicada por SMTP. Es la única opción que entrega en bandeja de entrada sin dominio propio y sin costo, y el volumen está muy por debajo de sus límites.

## Consecuencias
- Se crea una cuenta de Gmail usada solo por la app, con verificación en dos pasos y una contraseña de aplicación.
- El usuario SMTP y la contraseña de aplicación viven en variables de entorno (principio 5).
- El envío se hace desde el servidor, a través de un módulo propio de correo que Better Auth invoca para la recuperación (ADR 005); cambiar de proveedor solo toca ese módulo.
- Si el envío falla, el ayudante sigue viendo el mensaje neutro de RF-9 y el error queda en los logs del servidor.
- Al inicio de cada semestre se prueba una recuperación de contraseña para detectar un bloqueo de la cuenta.
- Revertir: cambiar credenciales y host SMTP, o reemplazar el módulo de correo por la API de otro proveedor.

## Revisar si...
- Google elimina las contraseñas de aplicación o bloquea la cuenta.
- Los correos de recuperación empiezan a llegar a spam.
- El proyecto adquiere un dominio propio (Resend pasa a ser la mejor opción).
