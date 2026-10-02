# Spec 001 - MVP de ligas internas

## Contexto y objetivo
Cada sección de fútbol y futsal del curso juega una liga interna semestral a cargo de un ayudante. Hoy se lleva en un Excel con macros que sirve para una sola sección y cuyas fórmulas se rompen, por lo que la tabla de posiciones y la de goleadores dependen de un archivo frágil y difícil de usar en la cancha. Esta spec define una app web donde cada ayudante gestiona sus ligas desde el celular durante la fecha, las tablas se calculan solas al terminar cada partido y cualquiera puede consultarlas por un link público. Debe seguir funcionando varios semestres sin que su autor la mantenga. Dimensión esperada: hasta 5 ligas en curso por semestre, 8 equipos por liga y 20 jugadores por equipo.

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
- H7: Como ayudante quiero corregir un partido ya terminado mientras la fecha no esté finalizada para arreglar errores de la cancha.
- H8: Como ayudante quiero aplicar descuentos de puntos y traspasar jugadores para reflejar las decisiones del profesor.
- H9: Como ayudante quiero finalizar la liga al cierre del semestre para dejarla en el historial.
- H10: Como visitante quiero ver la tabla de posiciones y la de goleadores sin iniciar sesión para saber cómo va mi equipo.
- H11: Como ayudante quiero cambiar mi correo o mi contraseña, o eliminar mi cuenta, para controlar mis datos.

## Requisitos funcionales

### Cuentas
- RF-1: CUANDO una persona envía el registro con correo, contraseña y el código de invitación vigente, EL SISTEMA creará una cuenta de ayudante e iniciará su sesión.
- RF-2: SI el código de invitación no coincide con el vigente, ENTONCES EL SISTEMA rechazará el registro con el mensaje "Código de invitación incorrecto".
- RF-3: SI el correo ya pertenece a una cuenta, ENTONCES EL SISTEMA rechazará el registro y ofrecerá recuperar la contraseña.
- RF-4: SI la contraseña tiene menos de 8 caracteres, ENTONCES EL SISTEMA rechazará el registro o el cambio de contraseña indicando el mínimo.
- RF-5: EL SISTEMA no pedirá verificar el correo para activar la cuenta.
- RF-6: CUANDO un ayudante inicia sesión, al registrarse o con correo y contraseña correctos, EL SISTEMA mantendrá su sesión activa en ese dispositivo durante 30 días contados desde ese momento, salvo que la cierre.
- RF-7: SI un correo acumula 5 intentos fallidos de inicio de sesión en 15 minutos, ENTONCES EL SISTEMA rechazará todo inicio de sesión con ese correo durante los 15 minutos siguientes.
- RF-8: CUANDO un ayudante cierra sesión, EL SISTEMA terminará su sesión en ese dispositivo.
- RF-9: CUANDO alguien solicita recuperar la contraseña, EL SISTEMA mostrará el mensaje "Si el correo existe, te enviamos un link", exista o no una cuenta con ese correo.
- RF-10: CUANDO alguien solicita recuperar la contraseña de un correo registrado, EL SISTEMA enviará a ese correo un link para definir una contraseña nueva.
- RF-11: SI el link de recuperación tiene más de 1 hora o ya se usó, ENTONCES EL SISTEMA rechazará el cambio de contraseña e invitará a solicitar un link nuevo.
- RF-86: CUANDO se define una contraseña nueva mediante el link de recuperación, EL SISTEMA cerrará todas las sesiones abiertas de esa cuenta.
- RF-87: CUANDO un ayudante con sesión cambia su correo indicando su contraseña actual correcta, EL SISTEMA actualizará el correo sin enviar ningún mensaje de verificación.
- RF-88: SI el correo nuevo ya pertenece a otra cuenta, ENTONCES EL SISTEMA rechazará el cambio de correo.
- RF-89: CUANDO un ayudante con sesión cambia su contraseña indicando la actual correcta, EL SISTEMA la actualizará y cerrará sus sesiones en los demás dispositivos.
- RF-90: SI la contraseña actual indicada es incorrecta, ENTONCES EL SISTEMA rechazará el cambio de correo o de contraseña.
- RF-91: CUANDO un ayudante pide eliminar su cuenta, EL SISTEMA pedirá confirmación advirtiendo cuántas ligas, en curso y finalizadas, se eliminarán con ella.
- RF-92: CUANDO un ayudante confirma la eliminación de su cuenta, EL SISTEMA borrará la cuenta junto con todas sus ligas, sus datos y sus escudos, y cerrará todas sus sesiones.

### Autorización y visibilidad
- RF-12: MIENTRAS no hay sesión iniciada, EL SISTEMA no mostrará ninguna acción de creación, edición ni eliminación.
- RF-13: SI una solicitud de modificación llega sin sesión o de un ayudante que no es dueño de la liga afectada, ENTONCES EL SISTEMA la rechazará sin modificar ningún dato.
- RF-14: EL SISTEMA no mostrará en ninguna vista el correo ni otro dato de las cuentas de ayudante a quien no sea el titular de la cuenta.
- RF-93: MIENTRAS un ayudante con sesión ve una liga de la que no es dueño, EL SISTEMA le mostrará solo la vista pública de esa liga, sin acciones de creación, edición ni eliminación.

### Ligas
- RF-15: CUANDO un ayudante crea una liga con nombre y semestre, EL SISTEMA la registrará en curso y con ese ayudante como único dueño.
- RF-16: EL SISTEMA aceptará como semestre solo valores con formato `AAAA-1` o `AAAA-2`.
- RF-17: CUANDO un ayudante abre el formulario de nueva liga, EL SISTEMA sugerirá el semestre actual, con `-1` entre enero y julio y `-2` entre agosto y diciembre.
- RF-18: SI ya existe otra liga en el mismo semestre con el mismo nombre (comparación ignorando mayúsculas y espacios exteriores), ENTONCES EL SISTEMA rechazará la creación o edición e informará del conflicto.
- RF-19: SI el nombre de la liga tiene más de 60 caracteres o está vacío, ENTONCES EL SISTEMA lo rechazará.
- RF-20: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar su nombre y semestre.
- RF-21: EL SISTEMA permitirá a un ayudante ser dueño de cualquier cantidad de ligas, de uno o varios semestres.
- RF-22: MIENTRAS un ayudante tiene sesión iniciada, EL SISTEMA le permitirá abrir en cualquier momento la lista de sus ligas, separadas en curso y finalizadas.
- RF-94: MIENTRAS una liga en curso pertenece a un semestre ya terminado según el corte de RF-17, EL SISTEMA mostrará junto a ella, en la lista de su dueño, el aviso "El semestre terminó" con acceso directo a finalizarla.

### Equipos
- RF-23: MIENTRAS la liga está en curso y no tiene ninguna fecha, EL SISTEMA permitirá a su dueño agregar y eliminar equipos.
- RF-95: CUANDO el dueño pide eliminar un equipo, EL SISTEMA pedirá confirmación advirtiendo cuántos jugadores se eliminarán con él.
- RF-96: CUANDO el dueño confirma la eliminación de un equipo, EL SISTEMA borrará el equipo junto con sus jugadores y su escudo.
- RF-24: MIENTRAS la liga tiene al menos una fecha, EL SISTEMA no permitirá agregar ni eliminar equipos.
- RF-25: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar el nombre y el escudo de cada equipo.
- RF-26: SI el nombre de un equipo coincide con el de otro de la misma liga (ignorando mayúsculas y espacios exteriores), ENTONCES EL SISTEMA lo rechazará e informará del conflicto.
- RF-27: SI el nombre de un equipo tiene más de 30 caracteres o está vacío, ENTONCES EL SISTEMA lo rechazará.
- RF-28: DONDE el ayudante sube un escudo, EL SISTEMA aceptará solo archivos PNG, JPG o WebP de hasta 2 MB.
- RF-29: SI el archivo del escudo es SVG, de otro formato, su contenido no es realmente una imagen PNG, JPG o WebP aunque su extensión lo sea, o pesa más de 2 MB, ENTONCES EL SISTEMA lo rechazará indicando formatos y tamaño aceptados.
- RF-30: CUANDO se acepta un escudo, EL SISTEMA lo guardará reducido a un máximo de 256×256 px conservando su proporción.
- RF-31: MIENTRAS un equipo no tiene escudo, EL SISTEMA mostrará en su lugar un escudo genérico con la inicial del nombre del equipo.
- RF-32: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño reemplazar o quitar el escudo de un equipo.

### Jugadores
- RF-33: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño agregar jugadores a un equipo indicando solo su nombre a mostrar.
- RF-34: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño editar el nombre de un jugador.
- RF-35: SI el nombre de un jugador coincide con el de otro jugador de cualquier equipo de la misma liga (ignorando mayúsculas y espacios exteriores), ENTONCES EL SISTEMA lo rechazará e informará del conflicto.
- RF-36: SI el nombre de un jugador tiene más de 40 caracteres o está vacío, ENTONCES EL SISTEMA lo rechazará.
- RF-37: SI el jugador que se intenta eliminar tiene al menos un gol registrado, ENTONCES EL SISTEMA rechazará la eliminación y sugerirá editar su nombre.
- RF-38: CUANDO el dueño elimina un jugador sin goles registrados de una liga en curso, EL SISTEMA lo quitará de la liga.
- RF-39: CUANDO el dueño traspasa un jugador de una liga en curso a otro equipo de la misma liga, EL SISTEMA lo moverá a ese equipo sin guardar registro del equipo anterior.
- RF-40: CUANDO se traspasa un jugador, EL SISTEMA conservará sin cambios los goles que ya tenía y los marcadores de los partidos ya jugados.

  Dado Juan con 3 goles en Tigres y un partido terminado Tigres 2-1 Leones / Cuando el dueño traspasa a Juan a Leones / Entonces Juan sigue con 3 goles en la tabla de goleadores, el partido sigue 2-1 y Juan aparece en la lista de Leones y no en la de Tigres al anotar goles.

### Fechas
- RF-41: SI la liga tiene menos de 3 equipos, ENTONCES EL SISTEMA no permitirá generar una fecha e indicará el mínimo.
- RF-42: CUANDO el dueño genera una fecha, EL SISTEMA creará un partido por cada par de equipos de la liga, con todos los partidos pendientes.
- RF-97: CUANDO el dueño genera una fecha, EL SISTEMA propondrá el día actual como su día de juego y permitirá cambiarlo antes de crearla.
- RF-98: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño cambiar el día de juego de una fecha.
- RF-99: SI el día de juego coincide con el de otra fecha de la misma liga, ENTONCES EL SISTEMA rechazará la creación o el cambio e informará del conflicto.
- RF-100: SI la liga tiene una fecha abierta, ENTONCES EL SISTEMA no permitirá generar otra fecha e indicará que primero hay que finalizar la abierta.
- RF-43: EL SISTEMA numerará las fechas de una liga desde 1 según el orden cronológico de su día de juego, recalculando la numeración cada vez que se genera o elimina una fecha o cambia un día de juego.

  Dado las fechas 1 (10/09), 2 (17/09) y 3 (24/09) / Cuando el dueño elimina la del 17/09 y genera una con día 20/09 / Entonces las fechas quedan 1 (10/09), 2 (20/09) y 3 (24/09).

- RF-44 [MODIFICADO]: CUANDO el sistema genera el orden de una fecha, EL SISTEMA usará un orden con la menor cantidad posible de pares de partidos consecutivos que comparten un equipo. (Anterior: CUANDO el sistema genera el orden de una fecha y existe al menos un orden en que ningún equipo juega dos partidos consecutivos, EL SISTEMA usará uno de esos órdenes.)

  Dado una liga con 4 equipos / Cuando el dueño genera una fecha / Entonces el orden tiene exactamente 2 pares de partidos consecutivos que comparten un equipo, el mínimo posible con 4 equipos.

  Dado una liga con 5 equipos / Cuando el dueño genera una fecha / Entonces ningún equipo juega dos partidos consecutivos.

- RF-45: CUANDO el sistema genera el orden de una fecha que tiene una fecha anterior en orden cronológico, EL SISTEMA hará que su primer partido no enfrente al mismo par de equipos que el primer partido del orden final de esa fecha anterior, incluido cualquier reordenamiento manual.

  Dado una liga con 4 equipos A, B, C, D y una fecha anterior con orden final A-B, C-D, A-C, B-D, A-D, B-C / Cuando el dueño genera una fecha nueva con un día posterior / Entonces el orden tiene 2 pares de partidos consecutivos que comparten un equipo, el mínimo posible, y el primer partido no es A-B. [MODIFICADO] (Anterior: Entonces ningún equipo juega dos partidos seguidos y el primer partido no es A-B.)

  Dado una liga con 3 equipos y una fecha anterior que abrió con A-B / Cuando el dueño genera una fecha nueva con un día posterior / Entonces se crean 3 partidos y el primero es A-C o B-C, aunque algún equipo juegue dos partidos seguidos.

- RF-46: MIENTRAS la liga está en curso, EL SISTEMA permitirá a su dueño cambiar a mano el orden de los partidos de una fecha.
- RF-47: EL SISTEMA no distinguirá local ni visita en los partidos.
- RF-48: MIENTRAS una fecha no se ha finalizado nunca, EL SISTEMA la mostrará como abierta.
- RF-101: CUANDO el dueño pide finalizar una fecha abierta o incompleta, EL SISTEMA pedirá confirmación advirtiendo que sus partidos terminados ya no podrán modificarse y cuántos partidos quedarán pendientes.
- RF-102: CUANDO el dueño confirma la finalización de una fecha, EL SISTEMA bloqueará todos sus partidos terminados.
- RF-103: MIENTRAS un partido está bloqueado, EL SISTEMA no permitirá agregar, quitar ni reasignar sus goles, ni devolverlo a pendiente.
- RF-104: MIENTRAS una fecha finalizada tiene al menos un partido pendiente, EL SISTEMA la mostrará como incompleta junto con la cantidad de partidos pendientes.
- RF-105: MIENTRAS una fecha finalizada no tiene partidos pendientes, EL SISTEMA la mostrará como finalizada.
- RF-49: MIENTRAS una fecha está incompleta, EL SISTEMA permitirá jugar sus partidos pendientes con las mismas reglas que en una fecha abierta, y generar fechas nuevas.

  Dado una fecha abierta con 6 partidos, 4 terminados y 2 pendientes / Cuando el dueño la finaliza / Entonces los 4 terminados quedan bloqueados y la fecha se muestra incompleta con 2 pendientes.

  Dado esa fecha incompleta / Cuando otro día el dueño anota goles en los 2 pendientes, los termina y vuelve a finalizar la fecha / Entonces esos 2 también quedan bloqueados y la fecha se muestra finalizada.

- RF-106: CUANDO el dueño confirma la finalización de una fecha, EL SISTEMA le preguntará si era la última fecha del semestre y le ofrecerá finalizar la liga.
- RF-50: CUANDO el dueño confirma la eliminación de una fecha abierta, incompleta o finalizada, EL SISTEMA borrará la fecha con sus partidos y goles y recalculará ambas tablas.
- RF-51: CUANDO el dueño pide eliminar una fecha, EL SISTEMA pedirá confirmación indicando cuántos partidos terminados se perderán.

### Partidos y goles
- RF-52: EL SISTEMA mostrará en la vista de la fecha todos sus partidos en su orden, cada uno con sus dos equipos, su marcador y su estado (pendiente o terminado).
- RF-53: CUANDO el dueño anota un gol en un partido, EL SISTEMA le ofrecerá elegir entre los jugadores actuales de cualquiera de los dos equipos del partido y la opción "Gol sin autor" de cada uno de esos equipos.
- RF-54: CUANDO el dueño registra un gol, EL SISTEMA lo guardará en ese momento, de modo que no se pierda si se recarga la página o se cierra la app.
- RF-55: EL SISTEMA calculará el marcador de cada equipo en un partido como la cantidad de goles registrados a su favor.
- RF-56: CUANDO se registra un "Gol sin autor", EL SISTEMA lo sumará al marcador del equipo sin sumarlo a ningún jugador en la tabla de goleadores.
- RF-57: MIENTRAS un partido no está bloqueado, EL SISTEMA permitirá a su dueño quitar un gol registrado o reasignarlo a otro jugador actual o a "Gol sin autor" de cualquiera de los dos equipos del partido.
- RF-58: CUANDO el dueño termina un partido, EL SISTEMA lo marcará como terminado con el marcador que tenga en ese momento, incluido 0-0.
- RF-59: MIENTRAS un partido está pendiente, EL SISTEMA no lo contará en la tabla de posiciones ni sus goles en la de goleadores.
- RF-60: CUANDO un partido pasa a terminado o se modifica un gol de un partido terminado, EL SISTEMA recalculará ambas tablas de la liga.
- RF-61: EL SISTEMA permitirá consultar la tabla de posiciones y la de goleadores desde la vista de la fecha sin salir de ella.
- RF-84: CUANDO el dueño devuelve a pendiente un partido terminado no bloqueado, EL SISTEMA lo marcará como pendiente conservando sus goles y recalculará ambas tablas.
- RF-85: SI el mismo dato se modifica desde dos dispositivos distintos, ENTONCES EL SISTEMA conservará el último cambio recibido.

### Tabla de posiciones
- RF-62: EL SISTEMA mostrará por equipo: partidos jugados, ganados, empatados, perdidos, goles a favor, goles en contra, diferencia de gol y puntos.
- RF-63: EL SISTEMA otorgará 3 puntos por partido ganado, 1 por empatado y 0 por perdido.
- RF-64: EL SISTEMA calculará los puntos de un equipo como los obtenidos en partidos terminados menos la suma de sus descuentos.
- RF-65: EL SISTEMA ordenará la tabla por puntos, luego diferencia de gol, luego goles a favor y luego puntos obtenidos en los partidos terminados entre los equipos empatados.
- RF-107: CUANDO el sistema aplica el criterio de enfrentamiento directo, EL SISTEMA lo calculará una sola vez con los partidos entre todos los equipos que siguen empatados en puntos, diferencia de gol y goles a favor.
- RF-66: SI dos o más equipos siguen empatados después de todos los criterios, ENTONCES EL SISTEMA les asignará la misma posición.

  Dado A y B con 7 puntos, DG +2 y 5 GF, y un único partido entre ellos que ganó B / Cuando se muestra la tabla / Entonces B aparece sobre A.

  Dado A y B con 7 puntos, DG +2, 5 GF y sus partidos entre ellos empatados / Cuando se muestra la tabla / Entonces A y B comparten la misma posición.

  Dado A, B y C con 7 puntos, DG +2 y 5 GF, donde A suma 4 puntos entre ellos y B y C suman 1 cada uno / Cuando se muestra la tabla / Entonces A aparece primero y B y C comparten la posición siguiente.

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
- RF-76: MIENTRAS una liga está finalizada, EL SISTEMA no permitirá modificar ninguno de sus datos ni volver a ponerla en curso, salvo eliminarla completa según RF-78 y RF-79.
- RF-77: EL SISTEMA permitirá finalizar una liga sin fechas jugadas, que quedará en el historial con sus tablas en cero.
- RF-78: CUANDO el dueño pide eliminar una liga, en curso o finalizada, EL SISTEMA pedirá confirmación advirtiendo que se borrarán todos sus datos.
- RF-79: CUANDO el dueño confirma la eliminación de una liga, EL SISTEMA borrará la liga con todos sus datos y escudos.

### Parte pública
- RF-80: EL SISTEMA mostrará sin iniciar sesión una portada con las ligas en curso y, a continuación, el historial de ligas finalizadas, ambos agrupados por semestre del más reciente al más antiguo.
- RF-108: SI no hay ninguna liga en curso, ENTONCES EL SISTEMA mostrará en la portada el mensaje "No hay ligas en curso por ahora" en lugar de la lista.
- RF-81: CUANDO un visitante abre una liga en curso, EL SISTEMA mostrará su tabla de posiciones, su tabla de goleadores y sus fechas con su número, día de juego, estado, partidos y marcadores.
- RF-82: CUANDO un visitante abre una liga finalizada, EL SISTEMA mostrará su tabla de posiciones final, su tabla de goleadores final y sus equipos con sus jugadores.
- RF-83: CUANDO se recarga una vista pública, EL SISTEMA mostrará los datos vigentes, incluidos los partidos terminados hasta ese momento.

## Requisitos no funcionales
- RNF-1: Desde la vista de la fecha, anotar un gol requiere como máximo 2 toques (agregar gol en el partido, y elegir jugador o "Gol sin autor"), sin paso de confirmación.
- RNF-2: La tabla de posiciones de una liga pública se ve completa en menos de 3 s con caché vacía, medido con red simulada "Slow 4G" (150 ms de latencia y 1,6 Mbps de bajada) y CPU 4 veces más lenta.
- RNF-3: Todas las vistas se usan sin desplazamiento horizontal desde 360 px de ancho de pantalla.

## Casos límite
- Liga con 3 o 4 equipos [MODIFICADO]: no existe ningún orden sin partidos consecutivos del mismo equipo; el mínimo es 2 pares consecutivos que comparten un equipo, y RF-44 exige ese mínimo. Desde 5 equipos el mínimo es 0. (Anterior: Liga con exactamente 3 equipos: la fecha tiene 3 partidos y es inevitable que algún equipo juegue dos seguidos (RF-44 no aplica).)
- Liga con 8 equipos: la fecha tiene 28 partidos y la generación sigue cumpliendo RF-42 a RF-45.
- Fecha sin fecha anterior en orden cronológico (la primera, o una generada con un día anterior a todas): RF-45 no aplica.
- Fecha generada con un día entre dos existentes: toma el número intermedio y las posteriores se renumeran (RF-43).
- Equipo sin jugadores: se pueden generar fechas y anotarle goles solo como "Gol sin autor".
- Partido terminado sin goles: cuenta como empate 0-0.
- Partido pendiente con goles registrados: no cuenta en ninguna tabla hasta que se termine.
- Gol quitado o reasignado en un partido terminado no bloqueado: ambas tablas se recalculan (RF-60).
- Gol anotado al equipo equivocado: mientras el partido no está bloqueado, se reasigna a un jugador o a "Gol sin autor" del otro equipo (RF-57).
- Jugador traspasado después de marcar: sus goles siguen siendo suyos y aparece con su equipo actual.
- Descuento mayor a los puntos del equipo: los puntos quedan negativos.
- Empate de más de dos equipos: el enfrentamiento directo se calcula una sola vez entre todos ellos y los que siguen empatados comparten posición (RF-107, RF-66).
- Fecha finalizada sin ningún partido terminado: queda incompleta con todos sus partidos pendientes.
- Varias fechas incompletas a la vez: todas muestran sus pendientes y admiten jugarlos.
- Liga en curso de un semestre ya terminado: sigue en curso hasta que su dueño la finalice, con el aviso de RF-94.
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
- Finalización automática de una liga al terminar el semestre.
- Modificar partidos bloqueados de una fecha finalizada.
- Reasignar goles a jugadores que ya no pertenecen a ninguno de los dos equipos del partido.
- Dos fechas de la misma liga en el mismo día de juego.
- Verificar el correo nuevo al cambiarlo.

## Criterios de finalización
- Cada RF tiene al menos un test automatizado que lo cubre y pasa en CI (reglas de dominio con test unitario; flujos con test E2E, según la constitución).
- Existe un test E2E que recorre en un viewport de 360 px: registro con código, crear liga, crear 4 equipos, agregar jugadores, generar fecha, anotar goles, terminar un partido, ver la tabla pública actualizada sin sesión y finalizar la fecha.
- Existe un test E2E que recorre la finalización de una liga y verifica su vista pública en el historial.
- RNF-1, RNF-2 y RNF-3 están verificados con una medición registrada.
- La app está publicada en producción, accesible por un link público, con costo 0.

## Dudas abiertas
- Ninguna.

## Historial de cambios
- 2026-10-02 - RF-44, el escenario de 4 equipos de RF-45 y el caso límite de 3 equipos: el orden de la fecha pasa de "sin consecutivos si existe" a "con el mínimo posible de consecutivos" - con 4 equipos no existe ningún orden sin partidos consecutivos del mismo equipo (comprobado por búsqueda exhaustiva), así que la regla anterior nunca aplicaba a ligas de 3 o 4 equipos y su escenario era imposible.
