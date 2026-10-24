# TODOs

## 1. Catálogo de juegos

- [x] Obtener el listado de juegos disponibles desde la API. (`GET /api/games`)
- [x] Mostrar los juegos en el frontend mediante un catálogo. (`/games`)
- [x] Definir qué información básica muestra cada juego en el catálogo (nombre, descripción breve, imagen o icono y estado de disponibilidad).
  > La API todavía no expone imagen ni género. Se usa un ícono/tono derivado de `gameModule` y el estado sale de `hidden`.
- [x] Implementar estados de carga, error y catálogo vacío.
- [x] Permitir seleccionar un juego y navegar a su vista de información. (`/games/:gameId`)
- [ ] **Futuro:** mostrar en el dashboard accesos rápidos a los juegos más jugados.
  - [ ] Definir cómo se mide la popularidad de un juego.
  - [ ] Obtener desde la API los juegos más jugados.
  - [ ] Mostrar los juegos destacados en el dashboard.
  > El dashboard sigue siendo ilustrativo; solo se enlazó "Ver catálogo" a `/games`.

## 2. Vista de información del juego

- [x] Crear una vista genérica de información del juego, reutilizable para todos los juegos.
- [x] Obtener desde la API la información del juego seleccionado. (`GET /api/games/{id}`)
- [x] Mostrar la información general del juego (nombre, descripción, género y otros metadatos disponibles).
  > No hay género en la API; se muestran jugadores, duración, modalidad, versión y configuraciones.
- [x] Mostrar las reglas e instrucciones del juego. (pestaña "Reglas")
- [ ] Mostrar estadísticas del juego.
  > Bloqueado: no existe un endpoint de estadísticas por juego.
- [ ] Mostrar el historial de partidas del usuario para ese juego.
  > La API ya permite `GET /api/matches?gameId=&participantUserId=`; falta definir y construir la UI de historial.
- [x] Definir una estructura extensible para permitir que juegos particulares agreguen información o secciones específicas sin duplicar toda la vista.
  > `src/features/games/lib/sections.ts` registra secciones extra por `gameModule`.
- [x] Incorporar navegación entre la información general del juego y sus secciones.
  > Pestañas con `?tab=info|rules|matches`, compartibles por URL.
- [x] Implementar estados de carga, error y juego inexistente o no disponible.

## 3. Sección de matchmaking

- [x] Incorporar una sección o pestaña de matchmaking dentro de la vista del juego.
  > Pestaña "Partidas" con el panel de matchmaking (`MatchmakingPanel`).
- [x] Mostrar las opciones disponibles para jugar:
  - [x] Unirse a una partida rápida.
    > Visible como "Próximamente"; la cola rápida queda para una etapa futura.
  - [x] Crear una partida.
  - [x] Explorar partidas abiertas (esperando jugadores).
- [x] Definir y mostrar los estados relevantes del matchmaking (cargando, error, sin partidas, creando, esperando, iniciada y cancelada).
- [x] Definir cómo se actualiza la información de matchmaking mediante SignalR.
  > El listado se actualiza con un botón de recarga. La sala de espera usa el grupo `match:{matchId}` de `RealtimeHub` con `MatchUpdated`, `MatchStarted` y `MatchCanceled`; al reconectar sólo reconsulta.
- [x] Implementar estados de carga, error y ausencia de partidas disponibles.

## 4. Partidas abiertas (esperando jugadores)

- [x] Obtener desde la API el listado de partidas abiertas del juego seleccionado.
  > `GET /api/matches?gameId=&status=0&page=&pageSize=&sort=-createdAt`, con respuesta paginada.
- [x] Definir qué partidas se consideran abiertas y disponibles para unirse.
  > `Status = Pending`. Se incluyen públicas y privadas; las privadas piden contraseña. `FriendsOnly` se ignora hasta que existan amistades.
- [x] Mostrar las partidas disponibles con información útil (jugadores actuales, capacidad máxima, estado, visibilidad y requisitos de acceso).
  > El DTO de participante ya incluye nickname y avatar. `Game.MaxPlayers == null` se muestra como "sin límite" con un límite visual temporal de 8 asientos.
- [x] Permitir actualizar el listado de partidas.
- [x] Actualizar el listado en tiempo real cuando una partida aparezca, deje de estar disponible o cambie su cantidad de participantes.
  > Decisión: no se actualiza en tiempo real; se usa el botón "Actualizar" y se recarga al volver a la pestaña.
- [x] Permitir seleccionar una partida y consultar los detalles necesarios antes de unirse.
  > La tarjeta muestra participantes, capacidad, visibilidad y fecha; el formulario de ingreso permite elegir asiento y, si corresponde, contraseña.
- [x] Mostrar un estado vacío cuando no haya partidas disponibles.
- [x] Permitir unirse mediante un enlace de invitación (`/join?code=...`) o pegando el código/enlace en el panel.

## 5. Creación de partidas

- [x] Definir las opciones disponibles al crear una partida (visibilidad, asiento, configuraciones del juego).
- [x] Obtener desde la API las configuraciones disponibles para el juego seleccionado.
  > `GameConfigurationResponse` ahora incluye `dataType`, `required`, `defaultValue` y `options`.
- [x] Crear una partida a través de la API. (`POST /api/matches/custom`)
- [x] Validar las opciones de creación tanto en el frontend como en el backend.
  > Incluye contraseña obligatoria para partidas privadas, asiento dentro de la capacidad y configuraciones obligatorias.
- [x] Mostrar errores de validación y fallos al crear la partida.
- [x] Tras crear la partida, incorporar al usuario como participante y mostrar la vista de espera de jugadores.
- [ ] Definir qué ocurre si el creador abandona la partida antes de que comience.
  > Hoy puede salir y la partida queda sin dueño (`OwnerId = null`). Falta decidir si se cancela, se transfiere o se bloquea la salida del creador.

## 6. Unirse a una partida

- [x] Permitir que el usuario seleccione una partida abierta y solicite unirse.
- [x] Validar en el backend que la partida siga disponible y que el usuario cumpla los requisitos para unirse.
  > Pendiente en backend: validar los asientos de forma atómica para evitar carreras entre joins concurrentes.
- [x] Gestionar errores como partida llena, partida iniciada, partida inexistente o acceso no permitido.
- [x] Actualizar la información de participantes tras unirse correctamente.
- [x] Tras unirse, mostrar la vista de espera de jugadores.
- [x] Permitir abandonar una partida antes de que comience.
- [x] Actualizar el listado de partidas abiertas cuando la partida deje de admitir participantes.
  > Se recarga al volver al juego y también con "Actualizar".
- [x] Hacer idempotente el ingreso por enlace de invitación para quien ya participa.

## 7. Sala de espera de la partida

- [x] Crear una vista de sala de espera reutilizable para los juegos que la necesiten. (`/matches/:matchId`)
- [x] Mostrar los datos de la partida y la lista de participantes.
- [x] Actualizar en tiempo real la lista de participantes mediante SignalR.
  > `RealtimeHub.JoinMatchGroup(matchId)` + eventos de partida.
- [x] Mostrar el progreso hacia el mínimo de jugadores necesario para iniciar la partida.
- [ ] Definir cómo y cuándo una partida pasa de estar esperando jugadores a estar lista para comenzar.
  > Hoy sólo un admin puede cambiar el estado por `PATCH /api/matches/{id}`. Ver `TODO.md` del backend.
- [x] Gestionar la desconexión de participantes y su posible reconexión.
  > Al reconectar SignalR se vuelve a unir al grupo y se reconsulta la partida; no se expulsa al participante por desconectarse.
- [x] Gestionar el caso en que la partida se cancela o deja de estar disponible.
- [ ] Redirigir a los participantes a la vista de gameplay cuando la partida comience.
  > Fuera del alcance de esta etapa: la sala muestra "La partida ya comenzó" y termina el flujo de matchmaking.

## 8. Gameplay

- [ ] Diseñar e implementar la vista de gameplay, inicialmente para un juego concreto.
- [ ] Definir una estructura compartida para los elementos comunes del gameplay y permitir que cada juego implemente su interfaz particular.
- [ ] Conectar la vista de gameplay con el hub de la partida.
- [ ] Enviar las acciones del jugador al backend mediante SignalR.
- [ ] Recibir y representar las actualizaciones del estado de la partida.
- [ ] Mostrar los resultados y el estado final de la partida.
- [ ] Gestionar la desconexión, reconexión y salida del jugador durante una partida.

## 9. Matchmaking rápido — futuro

- [ ] Definir los criterios para emparejar jugadores (juego, cantidad de jugadores, preferencias y otros criterios que se incorporen).
- [ ] Implementar la lógica de entrada y salida de la cola de matchmaking.
- [ ] Implementar el servicio backend que agrupe jugadores y genere o asigne partidas.
- [ ] Notificar mediante SignalR los cambios de estado de la búsqueda.
- [ ] Notificar cuando se encuentre una partida y comunicar los datos necesarios para acceder a ella.
- [ ] Mostrar el estado de búsqueda en el frontend.
- [ ] Permitir cancelar la búsqueda.
- [ ] Gestionar búsquedas canceladas, jugadores desconectados y partidas que no llegan a completarse.
- [ ] Evitar que un jugador participe simultáneamente en búsquedas o asignaciones incompatibles.
- [ ] Definir políticas de tiempo de espera y comportamiento cuando no se encuentran suficientes jugadores.

## 10. Validación e integración

- [ ] Verificar que el usuario pueda recorrer el flujo completo: catálogo → información del juego → matchmaking → creación o selección de partida → sala de espera.
  > Verificado por API y tests unitarios. Falta la prueba visual/E2E en navegador (el Chromium del entorno no tiene `libnspr4`/`libnss3`).
- [ ] Verificar permisos y reglas de acceso en el backend; no depender exclusivamente de validaciones del frontend.
  > Se verificó que el `JoinCode` no se expone a no participantes y que las partidas privadas piden contraseña. Queda pendiente la validación atómica de asientos.
- [ ] Verificar que las actualizaciones en tiempo real reflejen correctamente las acciones de otros participantes.
- [ ] Probar escenarios con varios usuarios y conexiones simultáneas.
  > Se probaron dos invitados vía API (crear, listar, unirse con contraseña y unirse por código); falta la prueba con dos navegadores.
- [ ] Verificar los casos de error y las transiciones entre estados de las partidas.
- [ ] Revisar que los componentes compartidos funcionen con juegos que tengan requisitos o interfaces particulares.
