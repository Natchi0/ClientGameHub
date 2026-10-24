<script setup lang="ts">
  import { Plus, Zap } from '@lucide/vue'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { Button } from '@/shared/ui/components/button'
  import { useGamesStore } from '@/features/games/stores/gamesStore'
  import type { GameDto } from '@/features/games/types'
  import MatchesList from '../components/MatchesList.vue'

  const route = useRoute()
  const gamesStore = useGamesStore()

  const gameQueryId = computed(() => {
    const value = Number(route.query.gameId)
    return Number.isInteger(value) && value > 0 ? value : null
  })

  const createOpen = ref(false)
  const joinOpen = ref(false)

  const selectedGame = computed<GameDto | undefined>(() =>
    gamesStore.games.find((game) => game.id === gameQueryId.value),
  )

  onMounted(() => {
    void gamesStore.load()
  })
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Partidas</h1>
        <p class="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
          Explorá las partidas disponibles, filtrá por juego o estado y creá tu propia sala.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled class="gap-2">
          <Zap :size="14" aria-hidden="true" />
          Partida rápida
          <span
            class="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
          >
            Próximamente
          </span>
        </Button>
        <Button type="button" size="sm" class="gap-2" @click="createOpen = true">
          <Plus :size="14" data-icon="inline-start" aria-hidden="true" />
          Crear partida
        </Button>
      </div>
    </header>

    <MatchesList :game="selectedGame" v-model:createOpen="createOpen" v-model:joinOpen="joinOpen" />
  </div>
</template>
