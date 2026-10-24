<script setup lang="ts">
  import { computed, markRaw, nextTick, onMounted, ref, watch } from 'vue'
  import {
    ChevronLeft,
    ChevronRight,
    Gamepad2,
    Inbox,
    KeyRound,
    List,
    Plus,
    RefreshCw,
    TriangleAlert,
    Zap,
  } from '@lucide/vue'
  import { RouterLink, useRouter } from 'vue-router'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { Button } from '@/shared/ui/components/button'
  import { Input } from '@/shared/ui/components/input'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import type { GameDto } from '@/features/games/types'
  import type { PagedResult } from '@/shared/types/pagination'
  import { matchesApi } from '../api/matchesApi'
  import CreateMatchForm from './CreateMatchForm.vue'
  import MatchListItem from './MatchListItem.vue'
  import { extractJoinCode } from '../lib/presentation'
  import { MatchStatus, type MatchDto } from '../types'

  const props = defineProps<{ game: GameDto }>()

  const PAGE_SIZE = 6

  const auth = useAuthStore()
  const router = useRouter()
  const matches = ref<PagedResult<MatchDto> | null>(null)
  const loading = ref(true)
  const refreshing = ref(false)
  const listError = ref<string | null>(null)
  const page = ref(1)
  const createOpen = ref(false)
  const joinCode = ref('')
  const joinCodeError = ref<string | null>(null)
  const createFormSection = ref<HTMLElement | null>(null)
  const listSection = ref<HTMLElement | null>(null)

  let requestId = 0

  const currentUserId = computed(() => {
    const id = auth.user?.id ?? (auth.claims?.sub ? Number(auth.claims.sub) : null)
    return id !== null && Number.isInteger(id) && id > 0 ? id : null
  })
  const totalPages = computed(() => matches.value?.totalPages ?? 0)
  const totalCount = computed(() => matches.value?.totalCount ?? 0)
  const hasPrevious = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  const quickActions = [
    {
      id: 'quick',
      title: 'Partida rápida',
      description: 'Entrá en una cola y te emparejamos con otro jugador.',
      icon: markRaw(Zap),
      disabled: true,
      badge: 'Próximamente',
    },
    {
      id: 'create',
      title: 'Crear partida',
      description: 'Armá una sala y elegí quién puede entrar.',
      icon: markRaw(Plus),
      disabled: false,
      badge: null,
    },
    {
      id: 'open',
      title: 'Partidas abiertas',
      description: 'Sumate a una sala que todavía espera jugadores.',
      icon: markRaw(List),
      disabled: false,
      badge: null,
    },
  ] as const

  function scrollTo(element: HTMLElement | null) {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    element?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  function onQuickAction(id: (typeof quickActions)[number]['id']) {
    if (id === 'create') {
      createOpen.value = true
      void nextTick(() => scrollTo(createFormSection.value))
    }

    if (id === 'open') scrollTo(listSection.value)
  }

  async function loadMatches({ silent = false } = {}) {
    const current = ++requestId
    if (silent) refreshing.value = true
    else loading.value = true
    listError.value = null

    try {
      const result = await matchesApi.index({
        gameId: props.game.id,
        status: MatchStatus.Pending,
        page: page.value,
        pageSize: PAGE_SIZE,
        sort: '-createdAt',
      })
      if (current !== requestId) return
      matches.value = result
    } catch (caught) {
      if (current !== requestId) return
      listError.value = normalizeApiError(caught).message ?? 'No pudimos cargar las partidas.'
    } finally {
      if (current === requestId) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  async function changePage(next: number) {
    if (next < 1 || next > totalPages.value || next === page.value) return
    page.value = next
    await loadMatches()
    scrollTo(listSection.value)
  }

  function goToMatch(match: MatchDto) {
    createOpen.value = false
    void router.push({ name: 'MatchWaiting', params: { matchId: match.id } })
  }

  function submitJoinCode() {
    const code = extractJoinCode(joinCode.value)
    if (!code) {
      joinCodeError.value = 'Ingresá un código o un enlace de invitación.'
      return
    }

    joinCodeError.value = null
    void router.push({ name: 'JoinMatch', query: { code } })
  }

  onMounted(() => loadMatches())
  watch(
    () => props.game.id,
    () => {
      page.value = 1
      matches.value = null
      createOpen.value = false
      joinCode.value = ''
      joinCodeError.value = null
      void loadMatches()
    },
  )
</script>

<template>
  <section class="space-y-6" aria-labelledby="matches-heading">
    <div class="max-w-2xl">
      <h2 id="matches-heading" class="text-xl font-bold tracking-[-0.02em]">Matchmaking</h2>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">
        Creá una sala para {{ game.displayName }} o unite a una partida que todavía espera
        jugadores.
      </p>
    </div>

    <div
      v-if="auth.isGuest"
      class="rounded-lg border border-border bg-surface p-4 text-sm leading-6"
    >
      <p>
        <strong class="font-semibold">Estás jugando como invitado.</strong>
        Podés crear y unirte a partidas, pero si perdés la sesión no vas a poder recuperar tu
        cuenta.
      </p>
      <RouterLink
        to="/register"
        class="mt-1 inline-block font-semibold text-primary hover:underline"
      >
        Crear una cuenta
      </RouterLink>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <button
        v-for="action in quickActions"
        :key="action.id"
        type="button"
        :disabled="action.disabled"
        :aria-expanded="action.id === 'create' ? createOpen : undefined"
        :class="[
          'flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors',
          action.disabled
            ? 'cursor-not-allowed opacity-65'
            : 'hover:border-primary/50 hover:bg-muted/40',
        ]"
        @click="onQuickAction(action.id)"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
        >
          <component :is="action.icon" :size="18" aria-hidden="true" />
        </span>
        <span class="min-w-0">
          <span class="flex flex-wrap items-center gap-2">
            <span class="font-semibold">{{ action.title }}</span>
            <span
              v-if="action.badge"
              class="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
            >
              {{ action.badge }}
            </span>
          </span>
          <span class="mt-1 block text-sm text-muted-foreground">{{ action.description }}</span>
        </span>
      </button>
    </div>

    <div v-if="createOpen" ref="createFormSection">
      <CreateMatchForm :game="game" @created="goToMatch" @cancel="createOpen = false" />
    </div>

    <section ref="listSection" class="space-y-3" aria-labelledby="open-matches-heading">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="open-matches-heading" class="text-lg font-bold tracking-[-0.02em]">
            Partidas abiertas
          </h3>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ totalCount }} {{ totalCount === 1 ? 'partida esperando' : 'partidas esperando' }}
            jugadores.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="loading || refreshing"
          @click="loadMatches({ silent: true })"
        >
          <RefreshCw :size="16" :class="refreshing ? 'motion-safe:animate-spin' : ''" />
          Actualizar
        </Button>
      </div>

      <div
        v-if="loading"
        class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
        aria-busy="true"
      >
        <p class="sr-only" role="status">Cargando partidas…</p>
        <div v-for="index in 3" :key="index" class="space-y-2 p-4 sm:p-5">
          <div class="h-4 w-24 rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-64 max-w-full rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-40 rounded bg-surface motion-safe:animate-pulse" />
        </div>
      </div>

      <div
        v-else-if="listError"
        role="alert"
        class="rounded-xl border border-danger/40 bg-danger-surface p-4 sm:p-5"
      >
        <div class="flex gap-3">
          <TriangleAlert :size="18" class="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p class="font-semibold text-danger">No pudimos cargar las partidas</p>
            <p class="mt-1 text-sm text-danger/90">{{ listError }}</p>
            <Button class="mt-3" size="sm" variant="outline" @click="loadMatches()">
              Reintentar
            </Button>
          </div>
        </div>
      </div>

      <div
        v-else-if="matches && matches.items.length === 0"
        class="rounded-xl border border-dashed border-border p-8 text-center"
      >
        <span
          class="mx-auto grid size-11 place-items-center rounded-full bg-surface text-muted-foreground"
        >
          <Inbox :size="20" aria-hidden="true" />
        </span>
        <p class="mt-3 font-semibold">No hay partidas esperando jugadores</p>
        <p class="mt-1 text-sm text-muted-foreground">
          Creá una sala o volvé a intentar en unos minutos.
        </p>
        <Button class="mt-4" size="sm" variant="outline" @click="loadMatches()">
          Actualizar
        </Button>
      </div>

      <div
        v-else-if="matches"
        class="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
      >
        <MatchListItem
          v-for="match in matches.items"
          :key="match.id"
          :game="game"
          :match="match"
          :current-user-id="currentUserId"
          @joined="goToMatch"
        />
      </div>

      <div v-if="matches && totalPages > 1" class="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          :disabled="!hasPrevious || loading"
          @click="changePage(page - 1)"
        >
          <ChevronLeft :size="16" data-icon="inline-start" /> Anterior
        </Button>
        <p class="text-sm text-muted-foreground">Página {{ matches.page }} de {{ totalPages }}</p>
        <Button
          variant="outline"
          size="sm"
          :disabled="!hasNext || loading"
          @click="changePage(page + 1)"
        >
          Siguiente <ChevronRight :size="16" data-icon="inline-end" />
        </Button>
      </div>
    </section>

    <form
      class="rounded-xl border border-border bg-card p-4 sm:p-5"
      aria-labelledby="join-code-heading"
      @submit.prevent="submitJoinCode"
    >
      <div class="flex items-start gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
        >
          <KeyRound :size="18" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <h3 id="join-code-heading" class="font-semibold">¿Te compartieron una invitación?</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            Pegá el código o el enlace completo para entrar a una partida.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <Input
              v-model="joinCode"
              class="min-w-56 flex-1"
              placeholder="Código o enlace de invitación"
              aria-label="Código o enlace de invitación"
              :aria-invalid="!!joinCodeError"
            />
            <Button type="submit">Unirme</Button>
          </div>
          <p v-if="joinCodeError" role="alert" class="mt-2 text-sm font-medium text-danger">
            {{ joinCodeError }}
          </p>
        </div>
      </div>
    </form>

    <p class="flex items-center gap-2 text-xs text-muted-foreground">
      <Gamepad2 :size="14" aria-hidden="true" />
      La partida rápida va a estar disponible en una próxima etapa.
    </p>
  </section>
</template>
