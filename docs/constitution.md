# Constitución de Liga Futsal

Principios innegociables. Cada uno permite responder sí o no ante un PR. El POR QUÉ de cada regla derivada de una decisión vive en su ADR en `docs/adr/`.

1. **La spec manda.** Ningún PR agrega ni cambia comportamiento que no esté descrito en una spec aprobada de `specs/`.
2. **Tests como puerta.** Todo cambio llega a `main` por PR y solo se integra con lint, tests unitarios y tests E2E en verde en CI; toda regla de dominio nueva trae al menos un test unitario que falla sin ella y todo flujo principal nuevo trae su test E2E.
3. **Escrituras por casos de uso.** Toda escritura pasa por un caso de uso del servidor que verifica la sesión y que quien la pide es el dueño de la liga afectada o una cuenta administradora definida en la configuración de la app antes de modificar datos, y los rechazos esperables se devuelven como resultado tipado, nunca como excepción; ocultar controles en la interfaz no cuenta como protección. Ver ADR 008 y ADR 010.
4. **Datos personales mínimos.** Los únicos datos personales que se guardan son el nombre a mostrar del jugador y el correo del ayudante, junto con el hash de su contraseña; los datos técnicos de la cuenta (sesiones, intentos de inicio de sesión, links de recuperación) no cuentan como datos personales, y la parte pública nunca expone datos de cuentas.
5. **Secretos fuera del repositorio.** El código de invitación, las claves y las credenciales viven solo en variables de entorno; ningún archivo versionado los contiene.
6. **Idioma.** La interfaz está en español de Chile; los documentos, commits y comentarios, en español; los identificadores de código, en inglés.
7. **Costo cero y TypeScript (restricciones del usuario).** No se usa ningún servicio, plan ni dependencia que cobre o exija registrar una tarjeta de crédito, y todo el código propio de la aplicación y de los tests está en TypeScript, salvo archivos de configuración que la herramienta exija en JavaScript.
8. **Dominio puro.** El código de `src/domain` no importa Next.js, React, Prisma, Better Auth ni módulos con efectos (red, base de datos, reloj), y una regla de lint lo verifica en CI. Ver ADR 008 y ADR 016.
