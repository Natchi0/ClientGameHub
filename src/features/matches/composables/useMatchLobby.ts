import { onBeforeUnmount, watch } from 'vue'
import { realtimeClient } from '@/shared/composables/useRealtimeConnection'
import type { RealtimeHubClient } from '@/shared/lib/realtime/realtimeHubClient'

const MATCH_EVENTS = ['MatchUpdated', 'MatchStarted', 'MatchCanceled'] as const

/**
 * Suscribe la sala de espera al grupo de la partida en `RealtimeHub`.
 * Sólo debe habilitarse cuando el usuario ya es participante: el hub aborta
 * la conexión si intenta entrar a un grupo ajeno.
 */
export function useMatchLobby(
  matchId: () => number | null,
  isEnabled: () => boolean,
  onChanged: () => void,
) {
  let activeClient: RealtimeHubClient | null = null
  let activeMatchId: number | null = null
  let joined = false
  let offEvents: Array<() => void> = []
  let offStatus: (() => void) | null = null
  let hadDisconnect = false

  function cleanup() {
    offEvents.forEach((off) => off())
    offEvents = []
    offStatus?.()
    offStatus = null

    if (activeClient && activeMatchId !== null && joined) {
      void activeClient.invoke('LeaveMatchGroup', activeMatchId).catch(() => {
        /* la conexión ya pudo haberse cerrado */
      })
    }

    activeClient = null
    activeMatchId = null
    joined = false
  }

  async function joinGroup(client: RealtimeHubClient) {
    const id = matchId()
    if (id === null || !isEnabled()) return

    try {
      await client.connect()
      if (id !== matchId() || !isEnabled()) return
      await client.invoke('JoinMatchGroup', id)
      activeMatchId = id
      joined = true
    } catch (error) {
      // La sala sigue funcionando con el botón de recarga.
      console.warn('No se pudo suscribir a la sala de espera', error)
    }
  }

  const stop = watch(
    [realtimeClient, matchId, isEnabled],
    ([client]) => {
      cleanup()
      if (!client || matchId() === null || !isEnabled()) return

      activeClient = client
      offEvents = MATCH_EVENTS.map((eventName) => client.on(eventName, () => onChanged()))
      offStatus = client.onStatusChange((status) => {
        if (status === 'reconnecting' || status === 'disconnected') hadDisconnect = true
        if (status !== 'connected' || !hadDisconnect) return

        hadDisconnect = false
        void joinGroup(client)
        onChanged()
      })

      void joinGroup(client)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stop()
    cleanup()
  })
}
