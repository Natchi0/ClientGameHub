import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { createRealtimeHubClient } from '@/shared/lib/realtime/realtimeHub'
import type { RealtimeHubClient } from '@/shared/lib/realtime/realtimeHubClient'

// los componentes se suscriben mediante realtimeClient y eliminan sus suscripciones al desmontarse
export const realtimeClient = shallowRef<RealtimeHubClient | null>(null)

export const connectedUsersCount = ref<number | null>(null)

export function useRealtimeConnection() {
  const auth = useAuthStore()

  // let client: RealtimeHubClient | null = null
  let connectedUserId: string | null = null
  let initialized = false
  let transition = Promise.resolve()

  async function syncConnection(userId: string | null) {
    // La identidad pudo cambiar mientras esperábamos otra transición.
    if (userId !== auth.claims?.sub) return

    if (userId === connectedUserId && realtimeClient.value) return

    const previous = realtimeClient.value
    connectedUsersCount.value = null
    realtimeClient.value = null
    connectedUserId = null

    if (previous) {
      await previous.disconnect()
    }

    // Evita conectar con una identidad que ya cambió.
    if (!userId || userId !== auth.claims?.sub) return

    const next = createRealtimeHubClient()

    next.on<[number]>('ConnectedUsersCountUpdated', (count) => {
      if (Number.isSafeInteger(count) && count >= 0) {
        connectedUsersCount.value = count
      }
    })

    realtimeClient.value = next
    connectedUserId = userId

    try {
      await next.connect()
    } catch (error) {
      console.error('No se pudo conectar al hub general de SignalR', error)
    }
  }

  function queueConnectionSync(userId: string | null) {
    // Serializa cambios de identidad para evitar carreras entre disconnect/connect.
    transition = transition
      .then(() => syncConnection(userId))
      .catch((error: unknown) => {
        console.error('Error al actualizar la conexión de SignalR', error)
      })
  }

  const stopWatching = watch(
    () => auth.claims?.sub ?? null,
    (userId) => {
      if (initialized) queueConnectionSync(userId)
    },
  )

  onMounted(async () => {
    try {
      // El router también lo invoca. El store comparte la operación en vuelo.
      await auth.ensureSession()
      initialized = true
      queueConnectionSync(auth.claims?.sub ?? null)
    } catch (error) {
      console.error('No se pudo asegurar la sesión para SignalR', error)
    }
  })

  onBeforeUnmount(() => {
    initialized = false
    stopWatching()

    transition = transition
      .then(async () => {
        const previous = realtimeClient.value
        realtimeClient.value = null
        connectedUserId = null
        await previous?.disconnect()
      })
      .catch((error: unknown) => {
        console.error('Error al cerrar la conexión de SignalR', error)
      })
  })

  return {
    getClient: () => realtimeClient.value,
  }
}
