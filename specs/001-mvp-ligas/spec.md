# Spec 001 - MVP de ligas internas

## Contexto y objetivo
Cada sección de fútbol y futsal del curso juega una liga interna semestral a cargo de un ayudante. Hoy se lleva en un Excel con macros que sirve para una sola sección y cuyas fórmulas se rompen, por lo que la tabla de posiciones y la de goleadores dependen de un archivo frágil y difícil de usar en la cancha. Esta spec define una app web donde cada ayudante gestiona sus ligas desde el celular durante la fecha, las tablas se calculan solas al terminar cada partido y cualquiera puede consultarlas por un link público. Debe seguir funcionando varios semestres sin que su autor la mantenga.

## Usuarios / actores
- Ayudante: se registra con un código de invitación y gestiona solo las ligas que creó: equipos, jugadores, fechas, goles, descuentos, traspasos, finalización y eliminación.
- Visitante (alumnos, profesor, cualquiera con el link): consulta sin iniciar sesión las ligas en curso, el historial y sus tablas; no puede modificar nada.
- Profesor: no usa la app para editar; guarda el código de invitación y lo entrega a los ayudantes nuevos.

## Historias de usuario
- H1: Como ayudante quiero registrarme con el código de invitación para gestionar la liga de mi sección.
- H2: Como ayudante quiero recuperar mi contraseña por correo para no perder el acceso a mis ligas.
- H3: Como ayudante quiero crear una liga con sus equipos y jugadores para empezar el semestre.
- H4: Como ayudante quiero generar una fecha con todos los partidos ya ordenados para no armar el fixture a mano.
- H5: Como ayudante quiero anotar cada gol desde el celular en la cancha para que el resultado quede registrado en el momento.
- H6: Como ayudante quiero terminar un partido y ver la tabla actualizada para responder cómo va la tabla durante la fecha.
- H7: Como ayudante quiero corregir un partido ya terminado para arreglar errores de la cancha.
- H8: Como ayudante quiero aplicar descuentos de puntos y traspasar jugadores para reflejar las decisiones del profesor.
- H9: Como ayudante quiero finalizar la liga al cierre del semestre para dejarla en el historial.
- H10: Como visitante quiero ver la tabla de posiciones y la de goleadores sin iniciar sesión para saber cómo va mi equipo.

## Requisitos funcionales

### Cuentas
- RF-1: CUANDO una persona envía el registro con correo, contraseña y el código de invitación vigente, EL SISTEMA creará una cuenta de ayudante e iniciará su sesión.
- RF-2: SI el código de invitación no coincide con el vigente, ENTONCES EL SISTEMA rechazará el registro con el mensaje "Código de invitación incorrecto".
- RF-3: SI el correo ya pertenece a una cuenta, ENTONCES EL SISTEMA rechazará el registro y ofrecerá recuperar la contraseña.
- RF-4: SI la contraseña tiene menos de 8 caracteres, ENTONCES EL SISTEMA rechazará el registro o el cambio de contraseña indicando el mínimo.
- RF-5: EL SISTEMA no pedirá verificar el correo para activar la cuenta.
- RF-6: CUANDO un ayudante inicia sesión con correo y contraseña correctos, EL SISTEMA mantendrá su sesión activa durante 30 días en ese dispositivo salvo que la cierre.
- RF-7: SI un correo acumula 5 intentos fallidos de inicio de sesión en 15 minutos, ENTONCES EL SISTEMA rechazará todo inicio de sesión con ese correo durante los 15 minutos siguientes.
- RF-8: CUANDO un ayudante cierra sesión, EL SISTEMA terminará su sesión en ese dispositivo.
- RF-9: CUANDO alguien solicita recuperar la contraseña, EL SISTEMA mostrará el mensaje "Si el correo existe, te enviamos un link", exista o no una cuenta con ese correo.
- RF-10: CUANDO alguien solicita recuperar la contraseña de un correo registrado, EL SISTEMA enviará a ese correo un link para definir una contraseña nueva.
- RF-11: SI el link de recuperación tiene más de 1 hora o ya se usó, ENTONCES EL SISTEMA rechazará el cambio de contraseña e invitará a solicitar un link nuevo.

### Autorización y visibilidad
- RF-12: MIENTRAS no hay sesión iniciada, EL SISTEMA no mostrará ninguna acción de creación, edición ni eliminación.
- RF-13: SI una solicitud de modificación llega sin sesión o de un ayudante que no es dueño de la liga afectada, ENTONCES EL SISTEMA la rechazará sin modificar ningún dato.
- RF-14: EL SISTEMA no mostrará en ninguna vista el correo ni otro dato de las cuentas de ayudante a quien no sea el titular de la cuenta.

### Ligas
- RF-15: CUANDO un ayudante crea una liga con nombre y semestre, EL SISTEMA la registrará en curso y con ese ayudante como único dueño.
- RF-16: EL SISTEMA aceptará como semestre solo valores con formato `AAAA-1` o `AAAA-2`.
- RF-17: CUANDO un ayudante abre el formulario de nueva liga, EL SISTEMA sugerirá el semestre actual, con `-1` entre enero y julio y `-2` entre agosto y diciembre.
- RF-18: SI ya existe otra liga en el mismo semestre con el mismo nombre (comparación ignorando mayúsculas y espacios exteriores), ENTONCES EL SISTEMA rechazará la creación o edición e informará del conflicto.
- RF-19: SI el nombre de la liga tiene más de 60 caracteres o está vacío, ENTONCES EL SISTEMA lo rechazará.
- RF-20: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar su nombre y semestre.
- RF-21: EL SISTEMA permitirá a un ayudante ser dueño de cualquier cantidad de ligas, de uno o varios semestres.
- RF-22: CUANDO un ayudante inicia sesión, EL SISTEMA le mostrará la lista de sus ligas separadas en curso y finalizadas.

### Equipos
- RF-23: MIENTRAS la liga no tiene ninguna fecha, EL SISTEMA permitirá a su dueño agregar y eliminar equipos.
- RF-24: MIENTRAS la liga tiene al menos una fecha, EL SISTEMA no permitirá agregar ni eliminar equipos.
- RF-25: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar el nombre y el escudo de cada equipo.
- RF-26: SI el nombre de un equipo coincide con el de otro de la misma liga (ignorando mayúsculas y espacios exteriores), ENTONCES EL SISTEMA lo rechazará e informará del conflicto.
- RF-27: SI el nombre de un equipo tiene más de 30 caracteres o está vacío, ENTONCES EL SISTEMA lo rechazará.
- RF-28: DONDE el ayudante sube un escudo, EL SISTEMA aceptará solo archivos PNG, JPG o WebP de hasta 2 MB.
- RF-29: SI el archivo del escudo es SVG, de otro formato o de más de 2 MB, ENTONCES EL SISTEMA lo rechazará indicando formatos y tamaño aceptados.
- RF-30: CUANDO se acepta un escudo, EL SISTEMA lo guardará reducido a un máximo de 256×256 px conservando su proporción.
- RF-31: MIENTRAS un equipo no tiene escudo, EL SISTEMA mostrará en su lugar un escudo genérico con la inicial del nombre del equipo.
- RF-32: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño reemplazar o quitar el escudo de un equipo.

### Jugadores
- RF-33: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño agregar jugadores a un equipo indicando solo su nombre a mostrar.
- RF-34: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar el nombre de un jugador.
- RF-35: SI el nombre de un jugador coincide con el de otro jugador de cualquier equipo de la misma liga (ignorando mayúsculas y espacios exteriores), ENTONCES EL SISTEMA lo rechazará e informará del conflicto.
- RF-36: SI el nombre de un jugador tiene más de 40 caracteres o está vacío, ENTONCES EL SISTEMA lo rechazará.
- RF-37: SI el jugador que se intenta eliminar tiene al menos un gol registrado, ENTONCES EL SISTEMA rechazará la eliminación y sugerirá editar su nombre.
- RF-38: CUANDO el dueño elimina un jugador sin goles registrados, EL SISTEMA lo quitará de la liga.
- RF-39: CUANDO el dueño traspasa un jugador a otro equipo de la misma liga, EL SISTEMA lo moverá a ese equipo sin guardar registro del equipo anterior.
- RF-40: CUANDO se traspasa un jugador, EL SISTEMA conservará sin cambios los goles que ya tenía y los marcadores de los partidos ya jugados.

  Dado Juan con 3 goles en Tigres y un partido terminado Tigres 2-1 Leones / Cuando el dueño traspasa a Juan a Leones / Entonces Juan sigue con 3 goles en la tabla de goleadores, el partido sigue 2-1 y Juan aparece en la lista de Leones y no en la de Tigres al anotar goles.

### Fechas
- RF-41: SI la liga tiene menos de 3 equipos, ENTONCES EL SISTEMA no permitirá generar una fecha e indicará el mínimo.
- RF-42: CUANDO el dueño genera una fecha, EL SISTEMA creará un partido por cada par de equipos de la liga, con todos los partidos pendientes.
- RF-43: CUANDO el dueño genera una fecha, EL SISTEMA le asignará el número siguiente al de la última fecha existente de la liga.
- RF-44: CUANDO el sistema genera el orden de una fecha y existe al menos un orden en que ningún equipo juega dos partidos consecutivos, EL SISTEMA usará uno de esos órdenes.
- RF-45: CUANDO el sistema genera el orden de una fecha y existe al menos un orden válido distinto al de la fecha anterior, EL SISTEMA usará un orden distinto al de la fecha anterior.

  Dado una liga con 4 equipos A, B, C, D y una fecha anterior con orden A-B, C-D, A-C, B-D, A-D, B-C / Cuando el dueño genera una fecha nueva / Entonces ningún equipo juega dos partidos seguidos y la secuencia de partidos no es idéntica a la anterior.

  Dado una liga con 3 equipos / Cuando el dueño genera una fecha / Entonces se crean 3 partidos y la secuencia es distinta a la de la fecha anterior, aunque algún equipo juegue dos partidos seguidos.

- RF-46: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño cambiar a mano el orden de los partidos de una fecha.
- RF-47: EL SISTEMA no distinguirá local ni visita en los partidos.
- RF-48: MIENTRAS una fecha tiene al menos un partido pendiente, EL SISTEMA la mostrará como incompleta junto con la cantidad de partidos pendientes.
- RF-49: MIENTRAS existe una fecha incompleta, EL SISTEMA permitirá generar fechas nuevas y registrar goles en los partidos pendientes de cualquier fecha.
- RF-50: CUANDO el dueño confirma la eliminación de una fecha, EL SISTEMA borrará la fecha con sus partidos y goles y recalculará ambas tablas.
- RF-51: CUANDO el dueño pide eliminar una fecha, EL SISTEMA pedirá confirmación indicando cuántos partidos terminados se perderán.

### Partidos y goles
- RF-52: EL SISTEMA mostrará en la vista de la fecha todos sus partidos en su orden, cada uno con sus dos equipos, su marcador y su estado (pendiente o terminado).
- RF-53: CUANDO el dueño anota un gol de un equipo, EL SISTEMA le ofrecerá elegir entre los jugadores actuales de ese equipo y la opción "Gol sin autor".
- RF-54: CUANDO el dueño registra un gol, EL SISTEMA lo guardará en ese momento, de modo que no se pierda si se recarga la página o se cierra la app.
- RF-55: EL SISTEMA calculará el marcador de cada equipo en un partido como la cantidad de goles registrados a su favor.
- RF-56: CUANDO se registra un "Gol sin autor", EL SISTEMA lo sumará al marcador del equipo sin sumarlo a ningún jugador en la tabla de goleadores.
- RF-57: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño quitar un gol registrado o cambiar su autor.
- RF-58: CUANDO el dueño termina un partido, EL SISTEMA lo marcará como terminado con el marcador que tenga en ese momento, incluido 0-0.
- RF-59: MIENTRAS un partido está pendiente, EL SISTEMA no lo contará en la tabla de posiciones ni sus goles en la de goleadores.
- RF-60: CUANDO un partido pasa a terminado o se modifica un gol de un partido terminado, EL SISTEMA recalculará ambas tablas de la liga.
- RF-61: EL SISTEMA permitirá consultar la tabla de posiciones y la de goleadores desde la vista de la fecha sin salir de ella.
- RF-84: CUANDO el dueño devuelve un partido terminado a pendiente, EL SISTEMA lo marcará como pendiente conservando sus goles y recalculará ambas tablas.
- RF-85: SI el mismo dato se modifica desde dos dispositivos distintos, ENTONCES EL SISTEMA conservará el último cambio recibido.

### Tabla de posiciones
- RF-62: EL SISTEMA mostrará por equipo: partidos jugados, ganados, empatados, perdidos, goles a favor, goles en contra, diferencia de gol y puntos.
- RF-63: EL SISTEMA otorgará 3 puntos por partido ganado, 1 por empatado y 0 por perdido.
- RF-64: EL SISTEMA calculará los puntos de un equipo como los obtenidos en partidos terminados menos la suma de sus descuentos.
- RF-65: EL SISTEMA ordenará la tabla por puntos, luego diferencia de gol, luego goles a favor y luego puntos obtenidos en los partidos terminados entre los equipos empatados.
- RF-66: SI dos o más equipos siguen empatados después de todos los criterios, ENTONCES EL SISTEMA les asignará la misma posición.

  Dado A y B con 7 puntos, DG +2 y 5 GF, y un único partido entre ellos que ganó B / Cuando se muestra la tabla / Entonces B aparece sobre A.

  Dado A y B con 7 puntos, DG +2, 5 GF y sus partidos entre ellos empatados / Cuando se muestra la tabla / Entonces A y B comparten la misma posición.

### Descuentos de puntos
- RF-67: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño aplicar a un equipo un descuento de una cantidad entera de puntos mayor que cero con un motivo obligatorio de hasta 100 caracteres.
- RF-68: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar o eliminar un descuento.
- RF-69: EL SISTEMA permitirá varios descuentos por equipo y permitirá que los puntos resultantes sean negativos.
- RF-70: MIENTRAS un equipo tiene al menos un descuento, EL SISTEMA mostrará un asterisco junto a sus puntos en la tabla y, asociado a él, cada motivo con su cantidad.

### Tabla de goleadores
- RF-71: EL SISTEMA mostrará en la tabla de goleadores cada jugador con al menos un gol en partidos terminados, con su equipo actual y su cantidad de goles, ordenados de mayor a menor.
- RF-72: SI dos o más jugadores tienen la misma cantidad de goles, ENTONCES EL SISTEMA les asignará la misma posición.

### Finalización y eliminación de ligas
- RF-73: CUANDO el dueño pide finalizar una liga, EL SISTEMA pedirá confirmación advirtiendo que la acción no se puede deshacer y cuántos partidos pendientes se descartarán.
- RF-74: CUANDO el dueño confirma la finalización, EL SISTEMA conservará solo el nombre y semestre de la liga, la tabla de posiciones final con sus descuentos y motivos, la tabla de goleadores final con el equipo de cada jugador, y los equipos con su escudo y su lista de jugadores.
- RF-75: CUANDO el dueño confirma la finalización, EL SISTEMA borrará las fechas, los partidos y los goles de la liga, y los partidos pendientes no contarán en las tablas finales.
- RF-76: MIENTRAS una liga está finalizada, EL SISTEMA no permitirá modificar ninguno de sus datos ni volver a ponerla en curso.
- RF-77: EL SISTEMA permitirá finalizar una liga sin fechas jugadas, que quedará en el historial con sus tablas en cero.
- RF-78: CUANDO el dueño pide eliminar una liga, en curso o finalizada, EL SISTEMA pedirá confirmación advirtiendo que se borrarán todos sus datos.
- RF-79: CUANDO el dueño confirma la eliminación de una liga, EL SISTEMA borrará la liga con todos sus datos y escudos.

### Parte pública
- RF-80: EL SISTEMA mostrará sin iniciar sesión una portada con las ligas en curso y, a continuación, el historial de ligas finalizadas agrupado por semestre, del más reciente al más antiguo.
- RF-81: CUANDO un visitante abre una liga en curso, EL SISTEMA mostrará su tabla de posiciones, su tabla de goleadores y sus fechas con los partidos, marcadores y estados.
- RF-82: CUANDO un visitante abre una liga finalizada, EL SISTEMA mostrará su tabla de posiciones final, su tabla de goleadores final y sus equipos con sus jugadores.
- RF-83: CUANDO se recarga una vista pública, EL SISTEMA mostrará los datos vigentes, incluidos los partidos terminados hasta ese momento.

## Requisitos no funcionales
- RNF-1: Desde la vista de la fecha, anotar un gol requiere como máximo 3 toques (equipo, jugador o "Gol sin autor", y confirmación si la hay).
- RNF-2: La tabla de posiciones de una liga pública se ve completa en menos de 3 s en un celular con conexión 4G, medido con caché vacía.
- RNF-3: Todas las vistas se usan sin desplazamiento horizontal desde 360 px de ancho de pantalla.
- RNF-4: Operar la app en producción tiene costo 0 con hasta 5 ligas en curso por semestre, 8 equipos por liga y 20 jugadores por equipo.

## Casos límite
- Liga con exactamente 3 equipos: la fecha tiene 3 partidos y es inevitable que algún equipo juegue dos seguidos (RF-44 no aplica).
- Liga con 8 equipos: la fecha tiene 28 partidos y la generación sigue cumpliendo RF-42 a RF-45.
- Primera fecha de la liga: no hay fecha anterior con la que comparar el orden (RF-45 no aplica).
- Equipo sin jugadores: se pueden generar fechas y anotarle goles solo como "Gol sin autor".
- Partido terminado sin goles: cuenta como empate 0-0.
- Partido pendiente con goles registrados: no cuenta en ninguna tabla hasta que se termine.
- Gol quitado o reasignado en un partido terminado: ambas tablas se recalculan (RF-60).
- Jugador traspasado después de marcar: sus goles siguen siendo suyos y aparece con su equipo actual.
- Descuento mayor a los puntos del equipo: los puntos quedan negativos.
- Empate de más de dos equipos: el criterio de enfrentamiento directo usa solo los partidos entre todos los equipos empatados.
- Varias fechas incompletas a la vez: todas muestran sus pendientes y admiten goles.
- Finalizar con fechas incompletas: los pendientes se descartan y no cuentan.
- Dos ligas con el mismo nombre en semestres distintos: se permiten.
- Nombre con mayúsculas o espacios distintos a uno existente ("tigres " frente a "Tigres"): se considera duplicado.
- Solicitud de recuperación repetida: cada link nuevo es válido 1 hora y de un solo uso.

## Fuera de alcance
- Cuenta, panel o rol de profesor; el código de invitación es fijo y solo se cambia en la configuración de la app.
- Registro libre sin código de invitación.
- Verificación del correo al registrarse.
- Más de un editor por liga o coayudantes.
- Cuentas para alumnos o visitantes.
- Datos de jugadores distintos del nombre a mostrar (RUT, correo, foto, número, posición).
- Historial de traspasos.
- Agregar o quitar equipos después de generar la primera fecha.
- Local y visita.
- Funcionamiento sin conexión.
- Tabla en vivo con partidos pendientes y actualización automática sin recargar.
- Reabrir una liga finalizada o consultar sus fechas y partidos.
- Tarjetas, sanciones disciplinarias, asistencia, árbitros, horarios y canchas.
- Estadísticas entre semestres.
- Pagos e inscripciones.
- Respaldo y exportación de datos.
- Escudos en formato SVG.

## Criterios de finalización
- Cada RF tiene al menos un test automatizado que lo cubre y pasa en CI (reglas de dominio con test unitario; flujos con test E2E, según la constitución).
- Existe un test E2E que recorre en un viewport de 360 px: registro con código, crear liga, crear 4 equipos, agregar jugadores, generar fecha, anotar goles, terminar un partido y ver la tabla pública actualizada sin sesión.
- Existe un test E2E que recorre la finalización de una liga y verifica su vista pública en el historial.
- RNF-1, RNF-2 y RNF-3 están verificados con una medición registrada.
- La app está publicada en producción, accesible por un link público, con costo 0.

## Dudas abiertas
- Ninguna.

## Historial de cambios
