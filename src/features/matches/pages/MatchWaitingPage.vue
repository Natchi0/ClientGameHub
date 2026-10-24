<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { isAxiosError } from 'axios'
  import { ArrowLeft, Check, Copy, Gamepad2, RefreshCw, TriangleAlert } from '@lucide/vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { appConfig } from '@/shared/config'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { Button } from '@/shared/ui/components/button'
  import { Input } from '@/shared/ui/components/input'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import { gamesApi } from '@/features/games/api/gamesApi'
  import type { GameDto } from '@/features/games/types'
  import { matchesApi } from '../api/matchesApi'
  import MatchParticipants from '../components/MatchParticipants.vue'
  import { useMatchLobby } from '../composables/useMatchLobby'
  import {
    buildInviteLink,
    capacityLabel,
    formatMatchDate,
    isParticipant,
    matchStatusLabel,
    matchVisibilityLabel,
    ownerParticipant,
    playerCount,
  } from '../lib/presentation'
  import { MatchStatus, type MatchDto } from '../types'

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const match = ref<MatchDto | null>(null)
  const game = ref<GameDto | null>(null)
  const loading = ref(true)
  const refreshing = ref(false)
  const notFound = ref(false)
  const error = ref<string | null>(null)
  const leaving = ref(false)
  const leaveConfirming = ref(false)
  const leaveError = ref<string | null>(null)
  const copied = ref(false)
  const copyError = ref<string | null>(null)

  let requestId = 0
  let copiedTimer: number | undefined

  const matchId = computed(() => {
    const raw = route.params.matchId
    const value = Number(Array.isArray(raw) ? raw[0] : raw)
    return Number.isInteger(value) && value > 0 ? value : null
  })
  const currentUserId = computed(() => {
    const id = auth.user?.id ?? (auth.claims?.sub ? Number(auth.claims.sub) : null)
    return id !== null && Number.isInteger(id) && id > 0 ? id : null
  })
  const inMatch = computed(() =>
    match.value ? isParticipant(match.value, currentUserId.value) : false,
  )
  const owner = computed(() => (match.value ? ownerParticipant(match.value) : null))
  const players = computed(() => (match.value ? playerCount(match.value) : 0))
  const capacity = computed(() =>
    match.value && game.value ? capacityLabel(match.value, game.value.maxPlayers) : '',
  )
  const inviteLink = computed(() =>
    match.value?.joinCode ? buildInviteLink(match.value.joinCode) : null,
  )
  const canShare = computed(
    () => inMatch.value && match.value?.status === MatchStatus.Pending && inviteLink.value !== null,
  )
  const backToGame = computed(() =>
    match.value
      ? { name: 'GameInfo', params: { gameId: match.value.gameId }, query: { tab: 'matches' } }
      : { name: 'Games' },
  )
  const minimumReached = computed(
    () => !!match.value && !!game.value && players.value >= game.value.minPlayers,
  )
  const pending = computed(() => match.value?.status === MatchStatus.Pending)
  const started = computed(() => match.value?.status === MatchStatus.Started)
  const closed = computed(
    () =>
      match.value?.status === MatchStatus.Finished || match.value?.status === MatchStatus.Canceled,
  )

  async function load({ silent = false } = {}) {
    const id = matchId.value
    if (id === null) {
      loading.value = false
      notFound.value = true
      return
    }

    const current = ++requestId
    if (silent) refreshing.value = true
    else loading.value = true
    error.value = null
    notFound.value = false

    try {
      const matchResult = await matchesApi.show(id)
      if (current !== requestId) return
      match.value = matchResult

      const gameResult = await gamesApi.show(matchResult.gameId)
      if (current !== requestId) return
      game.value = gameResult
    } catch (caught) {
      if (current !== requestId) return
      if (isAxiosError(caught) && caught.response?.status === 404) {
        match.value = null
        notFound.value = true
      } else {
        error.value = normalizeApiError(caught).message ?? 'No pudimos cargar la partida.'
      }
    } finally {
      if (current === requestId) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  function selectInviteInput(event: FocusEvent) {
    if (event.target instanceof HTMLInputElement) event.target.select()
  }

  async function copyInviteLink() {
    if (!inviteLink.value) return

    try {
      await navigator.clipboard.writeText(inviteLink.value)
      copied.value = true
      copyError.value = null
      window.clearTimeout(copiedTimer)
      copiedTimer = window.setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch {
      copyError.value = 'No pudimos copiar el enlace. Copialo manualmente.'
    }
  }

  async function leave() {
    if (!match.value) return

    leaving.value = true
    leaveError.value = null
    try {
      await matchesApi.leave(match.value.id)
      await router.push(backToGame.value)
    } catch (caught) {
      leaveError.value = normalizeApiError(caught).message ?? 'No pudimos salir de la partida.'
    } finally {
      leaving.value = false
    }
  }

  useMatchLobby(
    () => matchId.value,
    () => inMatch.value && pending.value,
    () => void load({ silent: true }),
  )

  onMounted(load)
  onBeforeUnmount(() => window.clearTimeout(copiedTimer))
  watch(
    () => route.params.matchId,
    () => void load(),
  )
  watch(
    [match, game],
    () => {
      if (match.value)
        document.title = `${game.value?.displayName ?? 'Partida'} - ${appConfig.app.name}`
    },
    { immediate: true },
  )
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6">
    <nav
      aria-label="Migas de pan"
      class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
    >
      <RouterLink :to="{ name: 'Games' }" class="font-semibold hover:text-foreground">
        Juegos
      </RouterLink>
      <span aria-hidden="true">/</span>
      <RouterLink
        v-if="game"
        :to="{ name: 'GameInfo', params: { gameId: game.id }, query: { tab: 'matches' } }"
        class="font-semibold hover:text-foreground"
      >
        {{ game.displayName }}
      </RouterLink>
      <span v-else aria-hidden="true">Juego</span>
      <span aria-hidden="true">/</span>
      <span class="text-foreground" aria-current="page">Sala de espera</span>
    </nav>

    <div v-if="loading" class="space-y-4" aria-busy="true">
      <p class="sr-only" role="status">Cargando partida…</p>
      <div class="h-36 rounded-xl bg-surface motion-safe:animate-pulse" />
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="h-64 rounded-xl bg-surface motion-safe:animate-pulse" />
        <div class="h-64 rounded-xl bg-surface motion-safe:animate-pulse" />
      </div>
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
      <h1 class="mt-4 text-2xl font-bold tracking-[-0.03em]">Partida no encontrada</h1>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Puede que ya no exista o que el enlace esté incompleto.
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
          <h1 class="font-semibold text-danger">No pudimos cargar la partida</h1>
          <p class="mt-1 text-sm text-danger/90">{{ error }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" @click="load()">Reintentar</Button>
            <Button as-child size="sm" variant="ghost">
              <RouterLink :to="{ name: 'Games' }">Volver al catálogo</RouterLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <template v-else-if="match">
      <header class="rounded-xl bg-surface p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span class="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
                {{ matchStatusLabel(match.status) }}
              </span>
              <span class="rounded-md bg-background px-2 py-1 text-muted-foreground">
                {{ matchVisibilityLabel(match.visibility) }}
              </span>
              <span class="text-muted-foreground">Partida #{{ match.id }}</span>
            </div>
            <h1 class="mt-3 text-3xl font-bold tracking-[-0.035em]">
              {{ game?.displayName ?? 'Sala de espera' }}
            </h1>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ capacity }}
              <template v-if="owner"> · Anfitrión: {{ owner.nickname }}</template>
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Creada el {{ formatMatchDate(match.createdAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="refreshing"
              @click="load({ silent: true })"
            >
              <RefreshCw :size="16" :class="refreshing ? 'motion-safe:animate-spin' : ''" />
              Recargar
            </Button>
            <Button as-child variant="ghost" size="sm">
              <RouterLink :to="backToGame">
                <ArrowLeft data-icon="inline-start" /> Volver al juego
              </RouterLink>
            </Button>
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section
          class="rounded-xl border border-border bg-card p-5"
          aria-labelledby="participants-heading"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="participants-heading" class="text-xl font-bold tracking-[-0.02em]">
                Participantes
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ players }} {{ players === 1 ? 'jugador' : 'jugadores' }} en la sala.
              </p>
            </div>
            <span
              v-if="game"
              class="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
            >
              {{ capacity }}
            </span>
          </div>

          <div
            v-if="!inMatch"
            class="mt-4 rounded-lg border border-border bg-surface/60 p-4 text-sm"
          >
            <p class="font-semibold">No participás en esta partida.</p>
            <p class="mt-1 text-muted-foreground">
              Podés volver al juego para unirte desde la lista de partidas abiertas.
            </p>
            <Button as-child class="mt-3" size="sm" variant="outline">
              <RouterLink :to="backToGame">Ver partidas abiertas</RouterLink>
            </Button>
          </div>

          <div v-if="game && pending" class="mt-5 rounded-lg border border-border p-4">
            <div class="flex items-center justify-between gap-3 text-sm">
              <p class="font-semibold">Progreso para iniciar</p>
              <p class="text-muted-foreground">
                {{ Math.min(players, game.minPlayers) }}/{{ game.minPlayers }} mínimo
              </p>
            </div>
            <progress
              class="mt-2 h-2 w-full overflow-hidden rounded-full accent-primary"
              :value="Math.min(players, game.minPlayers)"
              :max="game.minPlayers"
              :aria-label="`${players} de ${game.minPlayers} jugadores mínimos`"
            />
            <p class="mt-2 text-xs text-muted-foreground">
              {{
                minimumReached
                  ? 'El mínimo de jugadores está completo.'
                  : `Faltan ${game.minPlayers - players} jugadores para el mínimo.`
              }}
            </p>
          </div>

          <div class="mt-5">
            <MatchParticipants :match="match" />
          </div>
        </section>

        <aside class="space-y-4">
          <section
            v-if="canShare && inviteLink"
            class="rounded-xl border border-border bg-card p-5"
            aria-labelledby="invite-heading"
          >
            <h2 id="invite-heading" class="font-bold tracking-[-0.02em]">Invitar jugadores</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Compartí este enlace. Quien lo abra entra directamente a la partida.
            </p>
            <Input
              class="mt-3 font-mono text-xs"
              :model-value="inviteLink"
              readonly
              aria-label="Enlace de invitación"
              @focus="selectInviteInput"
            />
            <Button class="mt-2 w-full" variant="outline" size="sm" @click="copyInviteLink">
              <Check v-if="copied" :size="16" />
              <Copy v-else :size="16" />
              {{ copied ? 'Copiado' : 'Copiar enlace' }}
            </Button>
            <p v-if="copyError" role="alert" class="mt-2 text-xs font-medium text-danger">
              {{ copyError }}
            </p>
          </section>

          <section
            class="rounded-xl border border-border bg-card p-5"
            aria-labelledby="details-heading"
          >
            <h2 id="details-heading" class="font-bold tracking-[-0.02em]">Detalles</h2>
            <dl class="mt-3 divide-y divide-border text-sm">
              <div class="flex items-baseline justify-between gap-4 py-2">
                <dt class="text-muted-foreground">Estado</dt>
                <dd class="font-semibold">{{ matchStatusLabel(match.status) }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-2">
                <dt class="text-muted-foreground">Visibilidad</dt>
                <dd class="font-semibold">{{ matchVisibilityLabel(match.visibility) }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-2">
                <dt class="text-muted-foreground">Jugadores</dt>
                <dd class="font-semibold">{{ capacity }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="inMatch && pending"
            class="rounded-xl border border-border bg-card p-5"
            aria-labelledby="leave-heading"
          >
            <h2 id="leave-heading" class="font-bold tracking-[-0.02em]">Salir</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Podés abandonar la sala antes de que empiece la partida.
            </p>
            <div v-if="leaveConfirming" class="mt-3 flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" :disabled="leaving" @click="leave">
                {{ leaving ? 'Saliendo…' : 'Confirmar salida' }}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                :disabled="leaving"
                @click="leaveConfirming = false"
              >
                Cancelar
              </Button>
            </div>
            <Button v-else class="mt-3" variant="outline" size="sm" @click="leaveConfirming = true">
              Salir de la partida
            </Button>
            <p v-if="leaveError" role="alert" class="mt-2 text-sm font-medium text-danger">
              {{ leaveError }}
            </p>
          </section>

          <div v-if="auth.isGuest" class="rounded-lg border border-border bg-surface p-4 text-sm">
            <p class="font-semibold">Estás como invitado</p>
            <p class="mt-1 text-muted-foreground">
              Si perdés la sesión, no vas a poder recuperar esta cuenta.
            </p>
            <RouterLink
              to="/register"
              class="mt-2 inline-block font-semibold text-primary hover:underline"
            >
              Crear una cuenta
            </RouterLink>
          </div>
        </aside>
      </div>

      <section
        v-if="started"
        class="rounded-xl border border-primary/30 bg-primary/5 p-5"
        aria-labelledby="started-heading"
      >
        <div class="flex gap-3">
          <Gamepad2 :size="20" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="started-heading" class="font-semibold">La partida ya comenzó</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              La conexión con el juego se completó. La vista de gameplay se va a incorporar en una
              próxima etapa.
            </p>
          </div>
        </div>
      </section>

      <section
        v-else-if="closed"
        class="rounded-xl border border-border bg-surface p-5"
        aria-labelledby="closed-heading"
      >
        <h2 id="closed-heading" class="font-semibold">
          {{ match.status === MatchStatus.Canceled ? 'Partida cancelada' : 'Partida finalizada' }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Podés volver al juego para buscar otra partida.
        </p>
      </section>
    </template>
  </div>
</template>
