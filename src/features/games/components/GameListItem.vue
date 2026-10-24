<script setup lang="ts">
  import { computed } from 'vue'
  import { ArrowRight } from '@lucide/vue'
  import { RouterLink } from 'vue-router'
  import { Button } from '@/shared/ui/components/button'
  import { formatDuration, formatPlayers, getGameVisual } from '../lib/presentation'
  import type { GameDto } from '../types'

  const props = defineProps<{ game: GameDto }>()

  const visual = computed(() => getGameVisual(props.game))
  const duration = computed(() => formatDuration(props.game.maxDuration))
  const players = computed(() => formatPlayers(props.game.minPlayers, props.game.maxPlayers))
</script>

<template>
  <article
    class="grid gap-4 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5"
  >
    <div
      :class="[
        'relative flex aspect-[16/10] items-end overflow-hidden rounded-lg p-3',
        visual.tone,
      ]"
    >
      <component
        :is="visual.icon"
        :size="42"
        :stroke-width="1.5"
        class="absolute right-3 top-3 opacity-30"
        aria-hidden="true"
      />
      <span class="relative font-heading text-sm font-bold tracking-tight">{{ visual.label }}</span>
    </div>

    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-lg font-bold tracking-[-0.02em]">{{ game.displayName }}</h3>
        <span
          class="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
        >
          v{{ game.version }}
        </span>
      </div>
      <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ game.description }}</p>
      <p class="mt-2 text-xs font-medium text-muted-foreground">
        {{ players }}<template v-if="duration"> · {{ duration }}</template>
      </p>
    </div>

    <div class="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
      <span
        :class="[
          'inline-flex items-center gap-1.5 text-xs font-semibold',
          game.hidden ? 'text-danger' : 'text-primary',
        ]"
      >
        <span
          :class="['size-2 rounded-full', game.hidden ? 'bg-danger' : 'bg-primary']"
          aria-hidden="true"
        />
        {{ game.hidden ? 'Oculto' : 'Disponible' }}
      </span>
      <Button as-child variant="outline" size="sm">
        <RouterLink :to="{ name: 'GameInfo', params: { gameId: game.id } }">
          Ver juego <ArrowRight data-icon="inline-end" />
        </RouterLink>
      </Button>
    </div>
  </article>
</template>
