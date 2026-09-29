# ADR 005 - Autenticación con Better Auth

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
La spec 001 exige registro con correo, contraseña y código de invitación (RF-1, RF-2), sesiones de 30 días revocables (RF-6, RF-86, RF-89, RF-92), bloqueo del correo tras 5 intentos fallidos en 15 minutos (RF-7), recuperación con link de 1 hora y un solo uso con respuesta neutra (RF-9 a RF-11), y cambio de correo sin verificación, cambio de contraseña y eliminación de cuenta (RF-87 a RF-92). Del ayudante solo se guardan como datos personales el correo y el hash de su contraseña (principio 4), y la autorización se valida en el servidor (principio 3). La persistencia es Prisma sobre Neon (ADR 003, ADR 004).

## Opciones consideradas

### Opción A - Better Auth
Librería TypeScript con adaptador para Prisma; usuarios, sesiones y tokens en nuestra base. Trae correo y contraseña, sesiones en base con duración configurable, revocación de sesiones, recuperación con token configurable, cambio de correo y eliminación de cuenta. Gana: cubre casi todos los RF sin código propio de seguridad; el código de invitación se valida con un hook. Pierde: su limitador es por IP y ruta, así que el bloqueo por correo de RF-7 requiere un hook y una tabla de intentos; su campo `name` obligatorio debe guardarse vacío. Cambiarla: coste medio (tablas propias de la librería).

### Opción B - Auth.js con proveedor de credenciales
Gana: muy conocido. Pierde: la versión para App Router sigue en beta; con credenciales solo admite sesiones JWT, que no se pueden revocar sin un mecanismo aparte (RF-86, RF-89, RF-92); no trae recuperación, cambio de correo ni eliminación de cuenta. Cambiarla: coste medio.

### Opción C - Implementación propia
Argon2, tabla de sesiones con cookie `httpOnly`, tokens de recuperación e intentos en tablas propias. Gana: control total y exactamente los datos que pide la spec. Pierde: código de seguridad sensible escrito y revisado solo por el autor. Cambiarla: coste bajo a medio.

## Decisión
Better Auth (versión mayor 1), con su adaptador de Prisma. Cubre los RF de cuentas con sesiones en base de datos revocables y deja como código propio solo el bloqueo por correo de RF-7 y la validación del código de invitación.

## Consecuencias
- Las tablas de usuario, sesión y verificación las define Better Auth y se incorporan al esquema de Prisma mediante migraciones.
- El campo `name` del usuario se guarda vacío y nunca se pide ni se muestra (principio 4).
- El código de invitación se lee de una variable de entorno y se valida en un hook previo al registro (RF-2, principio 5).
- RF-7 se implementa con un hook sobre el inicio de sesión y una tabla de intentos fallidos por correo.
- La duración de sesión se fija en 30 días sin renovación automática (RF-6); cambiar la contraseña revoca las demás sesiones (RF-89) y la recuperación revoca todas (RF-86).
- El envío del correo de recuperación se delega en el servicio que fije la ADR de correo.
- Toda comprobación de sesión y de dueño de liga se hace en el servidor con la API de Better Auth, nunca solo en el cliente (principio 3).
- Revertir: migrar usuarios y hashes a otro sistema; las sesiones activas se pierden.

## Revisar si...
- Better Auth deja de mantenerse o una versión mayor rompe compatibilidad con su adaptador de Prisma.
- Better Auth no permite configurar alguno de los comportamientos de RF-6, RF-11, RF-86 o RF-89 y el código propio para suplirlo supera al de la opción C.
