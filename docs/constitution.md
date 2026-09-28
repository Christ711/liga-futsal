# Constitución de Liga Futsal

Principios innegociables. Cada uno permite responder sí o no ante un PR. El POR QUÉ de cada regla derivada de una decisión vive en su ADR en `docs/adr/`.

1. **La spec manda.** Ningún PR agrega ni cambia comportamiento que no esté descrito en una spec aprobada de `specs/`.
2. **Tests como puerta.** Todo cambio llega a `main` por PR y solo se integra con lint, tests unitarios y tests E2E en verde en CI; toda regla de dominio nueva trae al menos un test unitario que falla sin ella y todo flujo principal nuevo trae su test E2E.
3. **Autorización en el servidor.** Toda escritura verifica en el servidor que hay sesión y que el ayudante es dueño de la liga afectada; ocultar controles en la interfaz no cuenta como protección.
4. **Datos mínimos.** Del jugador solo se guarda el nombre a mostrar y del ayudante solo el correo y el hash de su contraseña; la parte pública nunca expone datos de cuentas.
5. **Secretos fuera del repositorio.** El código de invitación, las claves y las credenciales viven solo en variables de entorno; ningún archivo versionado los contiene.
6. **Idioma.** La interfaz está en español de Chile; los documentos, commits y comentarios, en español; los identificadores de código, en inglés.
7. **Costo cero (restricción del usuario).** No se usa ningún servicio, plan ni dependencia que cobre o que exija registrar una tarjeta de crédito.
8. **TypeScript (restricción del usuario).** Todo el código propio de la aplicación y de los tests está en TypeScript; solo se admite JavaScript en archivos de configuración que la herramienta exija en ese formato.
