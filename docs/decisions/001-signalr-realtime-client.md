# ADR-001: Cliente SignalR separado por transporte y hub de dominio

## Status

Accepted

## Date

2026-10-19

## Context

El cliente HTTP ya centraliza la URL, los tokens y las preocupaciones de sesión. Las partidas en tiempo real usan `MatchHub`, que no es un hub genérico: requiere `matchId` en la URL de conexión, autentica al participante y acepta comandos mediante `SendAction(actionType, payload)`. Envía actualizaciones con `StateUpdated`, rechazos con `ActionRejected` y, para algunos juegos, `MatchEnded`.

Permitir que cada vista cree su propio `HubConnection` repetiría ese contrato, dificultaría limpiar suscripciones y haría que otros hubs futuros hereden detalles de partidas.

## Decision

Usar dos capas en `src/shared/lib/realtime/`:

- `SignalRConnection`: transporte reutilizable que configura el token actual, el ciclo de vida, la reconexión automática y las suscripciones.
- `MatchHubClient`: cliente de dominio que añade el `matchId` validado y expone únicamente los comandos y eventos del `MatchHub`.

`createMatchHubClient(matchId)` aplica el hub configurado (`VITE_MATCH_HUB_URL`, o `/hubs/game` junto al origen de la API) y el token reactivo de la sesión. Los consumidores deben conservar el cierre de cada suscripción y llamar a `disconnect()` al abandonar una partida.

```ts
import { createMatchHubClient } from '@/shared/lib/realtime'

type ConnectFourState = {
  board: number[][]
}

const hub = createMatchHubClient<ConnectFourState>(matchId)
const stopState = hub.onStateUpdated((state) => updateBoard(state.board))
const stopRejected = hub.onActionRejected((reason) => showError(reason))

await hub.connect()
await hub.sendAction('PlacePiece', { column: 3 })

// Al salir de la vista:
stopState()
stopRejected()
await hub.disconnect()
```

## Alternatives Considered

### Usar `HubConnection` directamente en cada componente

Rechazado: duplica la construcción de URL, el token y el ciclo de vida, y permite invocar nombres de métodos arbitrarios sin reflejar el contrato del backend.

### Un singleton global para todas las partidas

Rechazado: una conexión incluye un único `matchId`. Reutilizarla entre rutas puede dejar suscripciones o contexto de partida obsoletos. El factory crea una instancia explícita por partida.

### Modelar cada estado de juego en la capa compartida

Rechazado: `shared` no debe conocer juegos concretos. El estado de `StateUpdated` es genérico y cada feature lo tipa al consumirlo.

## Consequences

- Las nuevas integraciones de hub reutilizan `SignalRConnection` y definen un cliente de dominio pequeño.
- La reconexión automática solo cubre conexiones ya establecidas; un fallo inicial de `connect()` se propaga al consumidor, que puede presentar un error o permitir reintento.
- La autenticación depende del token activo al iniciar o reconectar. SignalR puede transmitirlo como `access_token` en el query string cuando el navegador usa WebSockets, comportamiento propio del cliente oficial.
