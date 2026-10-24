<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { isAxiosError } from 'axios'
  import { ArrowLeft, ArrowRight, Gamepad2, TriangleAlert } from '@lucide/vue'
  import { RouterLink, useRoute } from 'vue-router'
  import { appConfig } from '@/shared/config'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { Button } from '@/shared/ui/components/button'
  import MatchesList from '@/features/matches/components/MatchesList.vue'
  import { gamesApi } from '../api/gamesApi'
  import {
    formatDuration,
    formatPlayers,
    getGameVisual,
    hostingModeLabel,
  } from '../lib/presentation'
  import { getExtraSections } from '../lib/sections'
  import type { GameDto } from '../types'

  interface Tab {
    id: string
    label: string
  }

  const route = useRoute()
  const game = ref<GameDto | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const notFound = ref(false)
  const matchCreateOpen = ref(false)
  const matchJoinOpen = ref(false)

  const visual = computed(() => (game.value ? getGameVisual(game.value) : null))
  const players = computed(() =>
    game.value ? formatPlayers(game.value.minPlayers, game.value.maxPlayers) : '',
  )
  const duration = computed(() => formatDuration(game.value?.maxDuration ?? null))
  const paragraphs = computed(() => {
    const text = game.value?.instructions.trim()
    return text
      ? text
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
      : []
  })
  const extraSections = computed(() => getExtraSections(game.value))
  const tabs = computed<Tab[]>(() => [
    { id: 'info', label: 'Información' },
    { id: 'rules', label: 'Reglas' },
    { id: 'matches', label: 'Partidas' },
    ...extraSections.value.map((section) => ({ id: section.id, label: section.label })),
  ])
  const activeTab = computed(() => {
    const requested = typeof route.query.tab === 'string' ? route.query.tab : 'info'
    return tabs.value.some((tab) => tab.id === requested) ? requested : 'info'
  })
  const activeExtraSection = computed(
    () => extraSections.value.find((section) => section.id === activeTab.value) ?? null,
  )

  let requestId = 0

  async function load() {
    const current = ++requestId
    const rawId = route.params.gameId
    const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId)

    game.value = null
    error.value = null
    notFound.value = false

    if (!Number.isInteger(gameId) || gameId <= 0) {
      loading.value = false
      notFound.value = true
      return
    }

    loading.value = true
    try {
      const result = await gamesApi.show(gameId)
      if (current !== requestId) return
      game.value = result
    } catch (e) {
      if (current !== requestId) return
      if (isAxiosError(e) && e.response?.status === 404) notFound.value = true
      else error.value = normalizeApiError(e).message ?? 'No pudimos cargar el juego.'
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  onMounted(load)
  watch(() => route.params.gameId, load)
  watch(
    [game, () => route.fullPath],
    () => {
      if (game.value) document.title = `${game.value.displayName} - ${appConfig.app.name}`
    },
    { immediate: true },
  )
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6">
    <nav aria-label="Migas de pan" class="text-sm text-muted-foreground">
      <RouterLink
        :to="{ name: 'Games' }"
        class="font-semibold transition-colors hover:text-foreground"
      >
        Juegos
      </RouterLink>
      <span aria-hidden="true" class="px-2">/</span>
      <span v-if="game" class="text-foreground" aria-current="page">{{ game.displayName }}</span>
      <span v-else>Juego</span>
    </nav>

    <div v-if="loading" class="space-y-6" aria-busy="true">
      <p class="sr-only" role="status">Cargando juego…</p>
      <div class="h-64 rounded-xl bg-surface motion-safe:animate-pulse" />
      <div class="h-10 w-72 rounded-md bg-surface motion-safe:animate-pulse" />
      <div class="h-48 rounded-xl bg-surface motion-safe:animate-pulse" />
    </div>

    <section
      v-else-if="notFound"
      class="rounded-xl border border-dashed border-border p-10 text-center sm:p-14"
    >
      <span
        class="mx-auto grid size-12 place-items-center rounded-full bg-surface text-muted-foreground"
      >
        <Gamepad2 :size="22" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold tracking-[-0.03em]">Juego no encontrado</h1>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Puede que ya no exista o que no esté disponible.
      </p>
      <Button as-child class="mt-5" variant="outline">
        <RouterLink :to="{ name: 'Games' }">
          <ArrowLeft data-icon="inline-start" /> Volver al catálogo
        </RouterLink>
      </Button>
    </section>

    <section
      v-else-if="error"
      role="alert"
      class="rounded-xl border border-danger/40 bg-danger-surface p-5 sm:p-6"
    >
      <div class="flex gap-3">
        <TriangleAlert :size="20" class="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <h1 class="font-semibold text-danger">No pudimos cargar el juego</h1>
          <p class="mt-1 text-sm text-danger/90">{{ error }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" @click="load">Reintentar</Button>
            <Button as-child size="sm" variant="ghost">
              <RouterLink :to="{ name: 'Games' }">Volver al catálogo</RouterLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <template v-else-if="game && visual">
      <section class="overflow-hidden rounded-xl bg-surface" aria-labelledby="game-title">
        <div class="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
          <div class="order-2 lg:order-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 text-xs font-semibold',
                  game.hidden ? 'text-danger' : 'text-primary',
                ]"
              >
              </span>
            </div>

            <h1
              id="game-title"
              class="mt-3 font-heading text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
            >
              {{ game.displayName }}
            </h1>
            <p class="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {{ game.description }}
            </p>
            <p class="mt-4 text-sm font-semibold">
              {{ players }}<template v-if="duration"> · {{ duration }} máximo</template>
            </p>

            <div class="mt-6 flex flex-wrap gap-2">
              <Button as-child>
                <RouterLink :to="{ name: 'Matches', query: { gameId: game?.id } }"
                  >Buscar partida <ArrowRight data-icon="inline-end"
                /></RouterLink>
              </Button>
              <Button as-child variant="outline">
                <RouterLink :to="{ name: 'Games' }">
                  <ArrowLeft data-icon="inline-start" /> Catálogo
                </RouterLink>
              </Button>
            </div>
          </div>

          <div
            :class="[
              'relative order-1 flex aspect-[16/9] items-end overflow-hidden rounded-lg p-5 lg:order-2 lg:aspect-square',
              visual.tone,
            ]"
          >
            <component
              :is="visual.icon"
              :size="120"
              :stroke-width="1.25"
              class="absolute -right-4 -top-4 opacity-20"
              aria-hidden="true"
            />
            <span class="relative font-heading text-lg font-bold tracking-tight">
              {{ visual.label }}
            </span>
          </div>
        </div>
      </section>

      <nav
        ref="tabsNav"
        aria-label="Secciones del juego"
        class="flex gap-1 overflow-x-auto overflow-y-clip border-b border-border"
      >
        <RouterLink
          v-for="tab in tabs"
          :key="tab.id"
          :to="{ query: tab.id === 'info' ? {} : { tab: tab.id } }"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          :class="[
            '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
            activeTab === tab.id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
          ]"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>

      <section
        v-if="activeTab === 'info'"
        class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"
        aria-labelledby="about-heading"
      >
        <div class="space-y-8">
          <div>
            <h2 id="about-heading" class="text-xl font-bold tracking-[-0.02em]">
              Acerca del juego
            </h2>
            <p class="mt-3 max-w-prose text-base leading-7 text-muted-foreground">
              {{ game.description }}
            </p>
          </div>

          <div v-if="game.configurations.length" class="border-t border-border pt-6">
            <h2 class="text-xl font-bold tracking-[-0.02em]">Opciones de partida</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Ajustes que se eligen al crear una sala.
            </p>
            <ul class="mt-4 flex flex-wrap gap-2">
              <li
                v-for="configuration in game.configurations"
                :key="configuration.id"
                class="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium"
              >
                {{ configuration.displayName }}
              </li>
            </ul>
          </div>
        </div>

        <aside class="lg:border-l lg:border-border lg:pl-8" aria-labelledby="details-heading">
          <h2
            id="details-heading"
            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Ficha
          </h2>
          <dl class="mt-3 divide-y divide-border text-sm">
            <div class="flex items-baseline justify-between gap-4 py-2.5">
              <dt class="text-muted-foreground">Jugadores</dt>
              <dd class="font-semibold">{{ players }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4 py-2.5">
              <dt class="text-muted-foreground">Duración</dt>
              <dd class="font-semibold">{{ duration ?? 'Sin límite' }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4 py-2.5">
              <dt class="text-muted-foreground">Modalidad</dt>
              <dd class="font-semibold">{{ hostingModeLabel(game.hostingMode) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-4 py-2.5">
              <dt class="text-muted-foreground">Versión</dt>
              <dd class="font-semibold">v{{ game.version }}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section v-else-if="activeTab === 'rules'" class="max-w-3xl" aria-labelledby="rules-heading">
        <h2 id="rules-heading" class="text-xl font-bold tracking-[-0.02em]">Cómo se juega</h2>
        <div
          v-if="paragraphs.length"
          class="mt-3 space-y-4 text-base leading-7 text-muted-foreground"
        >
          <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
        </div>
        <p v-else class="mt-3 text-sm text-muted-foreground">
          Este juego todavía no tiene reglas publicadas.
        </p>
      </section>

      <MatchesList
        v-else-if="activeTab === 'matches'"
        :game="game ?? undefined"
        :create-open="matchCreateOpen"
        :join-open="matchJoinOpen"
      />
      <component v-else-if="activeExtraSection" :is="activeExtraSection.component" :game="game" />
    </template>
  </div>
</template>
