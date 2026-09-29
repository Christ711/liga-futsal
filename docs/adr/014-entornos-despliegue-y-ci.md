# ADR 014 - Entornos, despliegue y CI

Fecha: 2026-09-28   Estado: Aceptada

## Contexto
Nada se integra a `main` sin lint, tests unitarios y E2E en verde en CI (principio 2). Vercel publica producción desde `main` y crea una URL de prueba por PR (ADR 001). El plan gratuito de Neon da 10 ramas por proyecto y 100 CU-horas al mes compartidas entre todas sus ramas (ADR 003). Las migraciones se aplican con `prisma migrate deploy` (ADR 004). El repo es público, así que GitHub Actions no tiene límite de minutos. Costo cero (principio 7). El autor tiene Docker Desktop.

## Opciones consideradas

### Opción A - Postgres en contenedor para CI y local, rama de Neon para las URLs de prueba
CI levanta un Postgres temporal como servicio del job, aplica migraciones y corre lint, tipos, unitarios, build y E2E; local usa el mismo Postgres en Docker; todas las URLs de prueba comparten una rama `preview` de Neon; producción usa la rama principal. Gana: CI rápido, aislado y sin gastar cuota de Neon; E2E sin datos compartidos; mismo motor en local y CI. Pierde: requiere Docker en local; las URLs de prueba comparten datos; CI no prueba contra Neon mismo. Cambiarla: coste bajo.

### Opción B - Una rama de Neon por PR
La integración Neon-Vercel crea una rama por URL de prueba y CI corre E2E contra ella. Gana: aislamiento total por PR contra Neon real. Pierde: el límite de 10 ramas exige limpieza automática; cómputo compartido con producción; CI depende de Neon; los E2E ensucian la rama. Cambiarla: coste medio.

### Opción C - Una sola rama de Neon para CI y URLs de prueba
Gana: la configuración más simple. Pierde: ejecuciones simultáneas se pisan los datos y producen tests inestables; consume cuota de Neon en cada ejecución. Cambiarla: coste bajo.

## Decisión
Postgres en contenedor para CI y desarrollo local, una rama `preview` de Neon compartida por las URLs de prueba y la rama principal de Neon para producción. CI queda aislado, rápido y gratis, sin tocar la cuota que usa producción.

## Consecuencias
- Entornos y bases:

  | Entorno | Base |
  |---|---|
  | Local | Postgres en Docker, misma versión mayor que Neon |
  | CI | Postgres temporal como servicio del job de GitHub Actions |
  | URL de prueba (PR) | Rama `preview` de Neon |
  | Producción | Rama principal de Neon |

- CI corre en cada PR hacia `main`, en este orden: instalación, `prisma generate`, formato, lint, verificación de tipos, tests unitarios, migraciones sobre la base temporal, build de producción y E2E contra ese build.
- `main` se protege en GitHub exigiendo que el job de CI pase antes del merge; no se permiten pushes directos.
- El build de Vercel aplica `prisma migrate deploy` contra la base de su entorno antes de `next build`; cada entorno tiene su propia `DATABASE_URL` como variable de entorno.
- Las migraciones deben ser compatibles hacia atrás: la versión anterior sigue sirviendo mientras se publica la nueva. Borrar o renombrar columnas se hace en dos PR (primero dejar de usarlas, después eliminarlas).
- La rama `preview` contiene solo datos de prueba y nunca se crea como copia de producción, para no exponer correos reales (principio 4); las URLs de prueba quedan protegidas con la autenticación de Vercel.
- Revertir: cambiar las variables de entorno y el workflow de CI; el código no cambia.

## Revisar si...
- Aparece un error en producción que CI no detectó por diferencias entre el Postgres del contenedor y Neon.
- El uso de cómputo de la rama `preview` pone en riesgo la cuota mensual de producción.
- Trabajar con varios PR a la vez hace que los datos compartidos de `preview` impidan revisarlos.
