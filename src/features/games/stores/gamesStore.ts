import { defineStore } from 'pinia'
import { ref } from 'vue'
import { gamesApi } from '../api/gamesApi'
import type { GameDto } from '../types'

export const useGamesStore = defineStore('games', () => {
  const games = ref<GameDto[]>([])
  const error = ref<string | null>(null)

  // El catálogo es chico y estable: es una sola pantalla, así que la cargamos
  // completa y la compartimos entre pantallas sin repetir requests.
  async function doLoad() {
    error.value = null
    try {
      games.value = await gamesApi.index()
    } catch {
      games.value = []
      error.value = 'No se pudo cargar el catálogo de juegos.'
    }
  }

  // evita carreras: varios consumidores al montarse comparten el request en curso
  let inflight: Promise<void> | null = null

  /** Garantiza que el catálogo esté cargado. Llamadas concurrentes comparten el fetch. */
  const load = () => (inflight ??= doLoad().finally(() => (inflight = null)))

  return { games, error, load }
})
