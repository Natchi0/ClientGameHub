# TODOs

## 1. Catálogo de juegos

- [ ] **Futuro:** mostrar en el dashboard accesos rápidos a los juegos más jugados.
  - [ ] Definir cómo se mide la popularidad de un juego.
  - [ ] Obtener desde la API los juegos más jugados.
  - [ ] Mostrar los juegos destacados en el dashboard.
  > El dashboard sigue siendo ilustrativo; solo se enlazó "Ver catálogo" a `/games`.

## 2. Vista de información del juego

- [ ] Mostrar estadísticas del juego.
  > Bloqueado: no existe un endpoint de estadísticas por juego.
- [ ] Mostrar el historial de partidas del usuario para ese juego.
  > La API ya permite `GET /api/matches?gameId=&participantUserId=`; falta definir y construir la UI de historial.

## 3. Creación de partidas

- [ ] Definir qué ocurre si el creador abandona la partida antes de que comience.
  > Hoy puede salir y la partida queda sin dueño (`OwnerId = null`). Falta decidir si se cancela, se transfiere o se bloquea la salida del creador.
- [ ] Obligar que una partida privada tenga contraseña

## 4. Sala de espera de la partida

- [ ] Definir cómo y cuándo una partida pasa de estar esperando jugadores a estar lista para comenzar.
  > Hoy sólo un admin puede cambiar el estado por `PATCH /api/matches/{id}`. Ver `TODO.md` del backend.
- [ ] Redirigir a los participantes a la vista de gameplay cuando la partida comience.
  > Fuera del alcance de esta etapa: la sala muestra "La partida ya comenzó" y termina el flujo de matchmaking.

## 5. Gameplay

- [ ] Diseñar e implementar la vista de gameplay, inicialmente para un juego concreto.
- [ ] Definir una estructura compartida para los elementos comunes del gameplay y permitir que cada juego implemente su interfaz particular.
- [ ] Conectar la vista de gameplay con el hub de la partida.
- [ ] Enviar las acciones del jugador al backend mediante SignalR.
- [ ] Recibir y representar las actualizaciones del estado de la partida.
- [ ] Mostrar los resultados y el estado final de la partida.
- [ ] Gestionar la desconexión, reconexión y salida del jugador durante una partida.

## 6. Matchmaking rápido — futuro

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

## 7. Validación e integración

- [ ] Verificar que el usuario pueda recorrer el flujo completo: catálogo → información del juego → matchmaking → creación o selección de partida → sala de espera.
  > Verificado por API y tests unitarios. Falta la prueba visual/E2E en navegador (el Chromium del entorno no tiene `libnspr4`/`libnss3`).
- [ ] Verificar permisos y reglas de acceso en el backend; no depender exclusivamente de validaciones del frontend.
  > Se verificó que el `JoinCode` no se expone a no participantes y que las partidas privadas piden contraseña. Queda pendiente la validación atómica de asientos.
- [ ] Verificar que las actualizaciones en tiempo real reflejen correctamente las acciones de otros participantes.
- [ ] Probar escenarios con varios usuarios y conexiones simultáneas.
  > Se probaron dos invitados vía API (crear, listar, unirse con contraseña y unirse por código); falta la prueba con dos navegadores.
- [ ] Verificar los casos de error y las transiciones entre estados de las partidas.
- [ ] Revisar que los componentes compartidos funcionen con juegos que tengan requisitos o interfaces particulares.
