<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { Gamepad2, RefreshCw, TriangleAlert } from '@lucide/vue'
  import { Button } from '@/shared/ui/components/button'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { gamesApi } from '../api/gamesApi'
  import GameListItem from '../components/GameListItem.vue'
  import type { GameDto } from '../types'

  const games = ref<GameDto[] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let requestId = 0

  async function load() {
    const current = ++requestId
    loading.value = true
    error.value = null

    try {
      const result = await gamesApi.index()
      if (current !== requestId) return
      games.value = [...result].sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
    } catch (e) {
      if (current !== requestId) return
      games.value = null
      error.value = normalizeApiError(e).message ?? 'No pudimos cargar los juegos.'
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  onMounted(() => load())
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Catálogo de juegos</h1>
        <p class="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
          Elegí un juego para ver sus reglas y, muy pronto, buscar partida.
        </p>
      </div>
      <Button variant="outline" size="sm" :disabled="loading" @click="load()">
        <RefreshCw :size="16" :class="loading ? 'motion-safe:animate-spin' : ''" />
        Actualizar
      </Button>
    </header>

    <p v-if="loading" class="sr-only" role="status">Cargando juegos…</p>

    <div
      v-if="loading && !games"
      class="overflow-hidden rounded-xl border border-border bg-card"
      aria-hidden="true"
    >
      <div
        v-for="index in 3"
        :key="index"
        class="flex gap-4 border-b border-border p-4 last:border-b-0 sm:gap-6 sm:p-5"
      >
        <div class="h-24 w-32 shrink-0 rounded-lg bg-surface motion-safe:animate-pulse" />
        <div class="flex-1 space-y-3 py-1">
          <div class="h-5 w-40 rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-full max-w-sm rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-24 rounded bg-surface motion-safe:animate-pulse" />
        </div>
      </div>
    </div>

    <section
      v-else-if="error"
      role="alert"
      class="rounded-xl border border-danger/40 bg-danger-surface p-5 sm:p-6"
    >
      <div class="flex gap-3">
        <TriangleAlert :size="20" class="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <h2 class="font-semibold text-danger">No se pudo cargar el catálogo</h2>
          <p class="mt-1 text-sm text-danger/90">{{ error }}</p>
          <Button class="mt-4" size="sm" variant="outline" @click="load()">Reintentar</Button>
        </div>
      </div>
    </section>

    <section
      v-else-if="games && games.length === 0"
      class="rounded-xl border border-dashed border-border p-10 text-center"
    >
      <span
        class="mx-auto grid size-12 place-items-center rounded-full bg-surface text-muted-foreground"
      >
        <Gamepad2 :size="22" aria-hidden="true" />
      </span>
      <h2 class="mt-4 text-lg font-bold">Todavía no hay juegos disponibles</h2>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Cuando se publique un juego, va a aparecer acá.
      </p>
      <Button class="mt-5" variant="outline" size="sm" @click="load()">Actualizar</Button>
    </section>

    <section v-else-if="games" aria-labelledby="games-heading">
      <div class="mb-3 flex items-center justify-between gap-4">
        <h2 id="games-heading" class="sr-only">Juegos disponibles</h2>
        <p class="text-sm font-medium text-muted-foreground">
          {{ games.length }} {{ games.length === 1 ? 'juego' : 'juegos' }}
        </p>
      </div>
      <div class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <GameListItem v-for="game in games" :key="game.id" :game="game" />
      </div>
    </section>
  </div>
</template>
