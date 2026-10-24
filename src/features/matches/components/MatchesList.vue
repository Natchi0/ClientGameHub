<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { RefreshCw, Search, SlidersHorizontal, X } from '@lucide/vue'
  import { Button } from '@/shared/ui/components/button'
  import { Input } from '@/shared/ui/components/input'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectItemText,
    SelectTrigger,
    SelectValue,
  } from '@/shared/ui/components/select'
  import { useGamesStore } from '@/features/games/stores/gamesStore'
  import type { GameDto } from '@/features/games/types'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import { matchesApi } from '../api/matchesApi'
  import MatchesTable from '../components/MatchesTable.vue'
  import CreateMatchDialog from '../components/CreateMatchDialog.vue'
  import JoinMatchDialog from '../components/JoinMatchDialog.vue'
  import { MatchStatus, MatchVisibility, type MatchDto, type MatchListQuery } from '../types'
  import { isParticipant, matchStatusLabel, matchVisibilityLabel } from '../lib/presentation'
  import { toast } from 'vue-sonner'
  import type { PagedResult } from '@/shared/types/pagination'

  const props = defineProps<{
    /** Cuando se entrega, el listado se filtra y se crea sólo para este juego. */
    game?: GameDto
    /** Estado externo de los diálogos (útil para abrirlos desde el header de la página). */
    createOpen: boolean
    joinOpen: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:createOpen', value: boolean): void
    (e: 'update:joinOpen', value: boolean): void
    (e: 'join', match: MatchDto): void
    (e: 'created', match: MatchDto): void
  }>()

  const auth = useAuthStore()
  const gamesStore = useGamesStore()
  const router = useRouter()

  // Estado local de los diálogos, sincronizado bidireccionalmente con los props
  // para que la página pueda abrirlos desde su header.
  const localCreateOpen = ref(props.createOpen)
  const localJoinOpen = ref(props.joinOpen)

  watch(
    () => props.createOpen,
    (value) => {
      localCreateOpen.value = value
    },
  )
  watch(
    () => props.joinOpen,
    (value) => {
      localJoinOpen.value = value
    },
  )
  watch(localCreateOpen, (value) => emit('update:createOpen', value))
  watch(localJoinOpen, (value) => emit('update:joinOpen', value))
  const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

  const matches = ref<PagedResult<MatchDto> | null>(null)
  const loading = ref(true)
  const refreshing = ref(false)
  const listError = ref<string | null>(null)

  const page = ref(1)
  const pageSize = ref(20)
  const search = ref('')
  const gameId = ref<number | null>(props.game?.id ?? null)
  // Por defecto mostramos lo que se puede unir ahora mismo: esperando jugadores
  // y visibilidad pública (igual comparables con «Todos los estados» / «Todas»).
  const DEFAULT_STATUS = MatchStatus.Pending
  const DEFAULT_VISIBILITY = MatchVisibility.Public
  const status = ref<number | null>(DEFAULT_STATUS)
  const visibility = ref<number | null>(DEFAULT_VISIBILITY)
  const sort = ref('-createdAt')

  const filtersOpen = ref(false)

  const joinMatch = ref<MatchDto | null>(null)
  const joinGame = ref<GameDto | null>(null)

  let requestId = 0
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const currentUserId = computed(() => {
    const id = auth.user?.id ?? (auth.claims?.sub ? Number(auth.claims.sub) : null)
    return id !== null && Number.isInteger(id) && id > 0 ? id : null
  })

  const totalPages = computed(() => matches.value?.totalPages ?? 0)
  const totalCount = computed(() => matches.value?.totalCount ?? 0)
  const hasPrevious = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  /** Filtros ocultos tras el botón «Filtros» que se apartan de los defaults. */
  const activeFilterCount = computed(() => {
    let count = 0
    if (!props.game && gameId.value !== null) count++
    if (status.value !== DEFAULT_STATUS) count++
    if (visibility.value !== DEFAULT_VISIBILITY) count++
    return count
  })

  const STATUS_OPTIONS = [
    { value: null, label: 'Todos los estados' },
    { value: MatchStatus.Pending, label: matchStatusLabel(MatchStatus.Pending) },
    { value: MatchStatus.Started, label: matchStatusLabel(MatchStatus.Started) },
    { value: MatchStatus.Finished, label: matchStatusLabel(MatchStatus.Finished) },
    { value: MatchStatus.Canceled, label: matchStatusLabel(MatchStatus.Canceled) },
  ] as const

  const VISIBILITY_OPTIONS = [
    { value: null, label: 'Todas las visibilidades' },
    { value: MatchVisibility.Public, label: matchVisibilityLabel(MatchVisibility.Public) },
    { value: MatchVisibility.Private, label: matchVisibilityLabel(MatchVisibility.Private) },
    {
      value: MatchVisibility.FriendsOnly,
      label: matchVisibilityLabel(MatchVisibility.FriendsOnly),
    },
  ] as const

  function params(): MatchListQuery {
    return {
      gameId: props.game?.id ?? gameId.value ?? undefined,
      status: (status.value ?? undefined) as MatchStatus | undefined,
      visibility: (visibility.value ?? undefined) as MatchVisibility | undefined,
      search: search.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
      sort: sort.value,
    }
  }

  /** Juegos para etiquetar filas y validar cupos: el juego de la pantalla tiene prioridad. */
  const tableGames = computed<GameDto[]>(() => (props.game ? [props.game] : gamesStore.games))
  const gamesForFilter = computed<GameDto[]>(() => gamesStore.games)

  async function loadMatches({ silent = false } = {}) {
    const current = ++requestId
    if (silent) refreshing.value = true
    else loading.value = true
    listError.value = null

    try {
      const result = await matchesApi.index(params())
      if (current !== requestId) return
      matches.value = result
    } catch (caught) {
      if (current !== requestId) return
      const errorMessage =
        caught instanceof Error ? caught.message : 'No se pudieron cargar las partidas.'
      listError.value = errorMessage
    } finally {
      if (current === requestId) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  /** Vuelve a pedir el listado con la configuración actual, desde la primera página. */
  function refresh() {
    page.value = 1
    void loadMatches({ silent: true })
  }

  async function changePage(next: number) {
    if (next < 1 || next > totalPages.value || next === page.value) return
    page.value = next
    await loadMatches()
  }

  function clearFilters() {
    if (!props.game) gameId.value = null
    status.value = DEFAULT_STATUS
    visibility.value = DEFAULT_VISIBILITY
  }

  function onJoin(match: MatchDto) {
    // El listado puede estar desactualizado: si ya participamos, directo a la sala.
    if (isParticipant(match, currentUserId.value)) {
      toast.info('Ya participás en esta partida.')
      void router.push({ name: 'MatchWaiting', params: { matchId: match.id } })
      return
    }
    joinMatch.value = match
    joinGame.value = props.game ?? gamesStore.games.find((g) => g.id === match.gameId) ?? null
    localJoinOpen.value = true
  }

  function onCreated(match: MatchDto) {
    localCreateOpen.value = false
    emit('created', match)
    void router.push({ name: 'MatchWaiting', params: { matchId: match.id } })
  }

  /** Unión correcta: cierra el diálogo y lleva a la sala de espera. */
  function onJoined(match: MatchDto) {
    localJoinOpen.value = false
    void router.push({ name: 'MatchWaiting', params: { matchId: match.id } })
  }

  onMounted(async () => {
    if (!props.game) void gamesStore.load()
    await loadMatches()
  })

  watch([gameId, status, visibility], () => {
    page.value = 1
    void loadMatches()
  })

  // Cambiar el orden (desde el select o desde el encabezado de la tabla)
  // siempre vuelve a la primera página.
  watch(sort, () => {
    page.value = 1
    void loadMatches()
  })

  watch(pageSize, () => {
    page.value = 1
    void loadMatches()
  })

  watch(
    () => props.game?.id,
    () => {
      page.value = 1
      gameId.value = props.game?.id ?? null
      void loadMatches()
    },
  )

  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      page.value = 1
      void loadMatches()
    }, 300)
  })
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <Search :size="14" class="shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            v-model="search"
            placeholder="Buscar por código o jugador…"
            class="w-64 sm:w-96"
            aria-label="Buscar partidas"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="gap-2"
          :aria-expanded="filtersOpen"
          aria-controls="matches-filters"
          @click="filtersOpen = !filtersOpen"
        >
          <SlidersHorizontal :size="14" data-icon="inline-start" aria-hidden="true" />
          Filtros
          <span
            v-if="activeFilterCount > 0"
            class="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
          >
            {{ activeFilterCount }}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="gap-2"
          aria-label="Actualizar partidas"
          title="Actualizar"
          :disabled="loading || refreshing"
          :aria-busy="refreshing"
          @click="refresh"
        >
          <RefreshCw
            :size="14"
            class="shrink-0"
            :class="refreshing && 'motion-safe:animate-spin'"
            aria-hidden="true"
          />
          Actualizar
        </Button>
      </div>

      <p class="text-sm text-muted-foreground">
        {{ totalCount }} {{ totalCount === 1 ? 'partida' : 'partidas' }}
      </p>
    </div>

    <div
      v-if="filtersOpen"
      id="matches-filters"
      class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3"
    >
      <div v-if="!props.game" class="flex items-center gap-2">
        <span class="text-xs font-semibold text-muted-foreground">Juego</span>
        <Select v-model="gameId">
          <SelectTrigger class="w-48">
            <SelectValue placeholder="Todos los juegos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="null">
              <SelectItemText>Todos los juegos</SelectItemText>
            </SelectItem>
            <SelectItem v-for="game in gamesForFilter" :key="game.id" :value="game.id">
              <SelectItemText>{{ game.displayName }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-muted-foreground">Estado</span>
        <Select v-model="status">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in STATUS_OPTIONS"
              :key="String(option.value)"
              :value="option.value"
            >
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-muted-foreground">Visibilidad</span>
        <Select v-model="visibility">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in VISIBILITY_OPTIONS"
              :key="String(option.value)"
              :value="option.value"
            >
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="ghost" size="sm" class="ml-auto" @click="clearFilters">
        <X :size="14" data-icon="inline-start" aria-hidden="true" />
        Limpiar
      </Button>
    </div>

    <p v-if="loading" class="sr-only" role="status">Cargando partidas…</p>

    <section
      v-if="loading && !matches"
      class="overflow-hidden rounded-xl border border-border bg-card"
      aria-busy="true"
    >
      <div class="divide-y divide-border p-4 sm:p-5">
        <div v-for="index in 4" :key="index" class="flex gap-4 py-3">
          <div class="h-4 w-20 shrink-0 rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-48 max-w-full rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-32 rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-24 rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-24 rounded bg-surface motion-safe:animate-pulse" />
          <div class="h-4 w-24 shrink-0 rounded bg-surface motion-safe:animate-pulse" />
        </div>
      </div>
    </section>

    <section
      v-else-if="listError"
      role="alert"
      class="rounded-xl border border-danger/40 bg-danger-surface p-5 sm:p-6"
    >
      <div class="flex gap-3">
        <div>
          <h2 class="font-semibold text-danger">No se pudieron cargar las partidas</h2>
          <p class="mt-1 text-sm text-danger/90">{{ listError }}</p>
          <Button class="mt-4" size="sm" variant="outline" @click="loadMatches()">
            Reintentar
          </Button>
        </div>
      </div>
    </section>

    <section
      v-else-if="matches && matches.items.length === 0"
      class="rounded-xl border border-dashed border-border p-10 text-center sm:p-14"
    >
      <span
        class="mx-auto grid size-12 place-items-center rounded-full bg-surface text-muted-foreground"
      >
        <RefreshCw :size="22" aria-hidden="true" />
      </span>
      <h2 class="mt-4 text-lg font-bold">No se encontraron partidas</h2>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Prueba con otros filtros o creá una partida nueva.
      </p>
      <div class="mt-5 flex justify-center">
        <Button size="sm" @click="localCreateOpen = true">Crear partida</Button>
      </div>
    </section>

    <section
      v-else-if="matches"
      class="relative transition-opacity"
      :class="refreshing && 'opacity-60'"
      :aria-busy="refreshing"
    >
      <p v-if="refreshing" class="sr-only" role="status">Actualizando partidas…</p>
      <MatchesTable
        v-model:sort="sort"
        :matches="matches.items"
        :games="tableGames"
        :current-user-id="currentUserId"
        @join="onJoin"
      />

      <!-- Tamaño de página y paginado, siempre debajo de la tabla. -->
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-muted-foreground">por página</span>
          <Select v-model="pageSize">
            <SelectTrigger class="w-20">
              <SelectValue :placeholder="String(pageSize)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
                <SelectItemText>{{ size }}</SelectItemText>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="totalPages > 1" class="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            :disabled="!hasPrevious || loading || refreshing"
            @click="changePage(page - 1)"
          >
            Anterior
          </Button>
          <p class="text-sm text-muted-foreground">Página {{ page }} de {{ totalPages }}</p>
          <Button
            variant="outline"
            size="sm"
            :disabled="!hasNext || loading || refreshing"
            @click="changePage(page + 1)"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </section>

    <CreateMatchDialog v-model:open="localCreateOpen" :game="props.game" @created="onCreated" />
    <JoinMatchDialog
      v-model:open="localJoinOpen"
      :match="joinMatch"
      :game="joinGame"
      @joined="onJoined"
    />
  </div>
</template>
