<script setup lang="ts">
  import { computed } from 'vue'
  import { Lock } from '@lucide/vue'
  import { RouterLink } from 'vue-router'
  import { Button } from '@/shared/ui/components/button'
  import { DataTable, type DataTableColumn } from '@/shared/ui/components/data-table'
  import type { GameDto } from '@/features/games/types'
  import type { MatchDto } from '../types'
  import {
    capacityLabel,
    formatMatchDate,
    getJoinAvailability,
    isParticipant,
    matchStatusLabel,
    matchVisibilityLabel,
    ownerParticipant,
  } from '../lib/presentation'
  import { MatchStatus, MatchVisibility } from '../types'

  const props = defineProps<{
    matches: MatchDto[]
    games: GameDto[]
    currentUserId: number | null
    sort: string
  }>()

  const emit = defineEmits<{
    (e: 'update:sort', value: string): void
    (e: 'join', match: MatchDto): void
  }>()

  const columns: DataTableColumn[] = [
    { id: 'id', header: 'ID', headerClass: 'w-12', cellClass: 'font-mono text-muted-foreground' },
    { id: 'gameId', header: 'Juego', sortKey: 'gameId' },
    { id: 'status', header: 'Estado', sortKey: 'status', defaultDesc: true },
    { id: 'visibility', header: 'Visibilidad' },
    { id: 'players', header: 'Jugadores' },
    { id: 'host', header: 'Anfitrión' },
    { id: 'createdAt', header: 'Creada', sortKey: 'createdAt', defaultDesc: true },
    { id: 'actions', header: 'Acciones', align: 'right' },
  ]

  const gameById = computed(() => new Map(props.games.map((game) => [game.id, game])))

  function matchRowKey(match: MatchDto): number {
    return match.id
  }

  function gameOf(match: MatchDto): GameDto | undefined {
    return gameById.value.get(match.gameId)
  }

  function availabilityOf(match: MatchDto): { allowed: boolean; reason: string | null } {
    const game = gameOf(match)
    return getJoinAvailability(match, game?.maxPlayers ?? null, props.currentUserId)
  }

  function ownerName(match: MatchDto): string | null {
    const owner = ownerParticipant(match)
    return owner?.nickname ?? null
  }

  function statusBadgeClass(match: MatchDto): string {
    if (match.status === MatchStatus.Pending) return 'bg-accent text-accent-foreground'
    if (match.status === MatchStatus.Started) return 'bg-primary text-primary-foreground'
    if (match.status === MatchStatus.Canceled) return 'bg-danger text-danger/90'
    return 'bg-muted text-muted-foreground'
  }
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="props.matches"
    :sort="props.sort"
    :row-key="matchRowKey"
    @update:sort="emit('update:sort', $event)"
  >
    <template #id="{ row }">#{{ row.id }}</template>

    <template #gameId="{ row }">
      <span class="text-foreground">{{ gameOf(row)?.displayName ?? `Juego #${row.gameId}` }}</span>
    </template>

    <template #status="{ row }">
      <span
        class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
        :class="statusBadgeClass(row)"
      >
        {{ matchStatusLabel(row.status) }}
      </span>
    </template>

    <template #visibility="{ row }">
      <span class="flex items-center gap-1.5">
        <span>{{ matchVisibilityLabel(row.visibility) }}</span>
        <Lock
          v-if="
            row.visibility === MatchVisibility.Private ||
            row.visibility === MatchVisibility.FriendsOnly
          "
          :size="12"
          class="shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </span>
    </template>

    <template #players="{ row }">
      <div class="text-foreground font-semibold">
        {{ capacityLabel(row, gameOf(row)?.maxPlayers ?? null) }}
      </div>
    </template>

    <!-- @TODO: esto puede ser un href al usuario una vez esté pronta la pantalla -->
    <template #host="{ row }">
      <p class="mt-0.5 text-xs text-muted-foreground">
        <template v-if="ownerName(row)">
          <span class="truncate">{{ ownerName(row) }}</span>
        </template>
      </p>
    </template>

    <template #createdAt="{ row }">
      <span class="text-muted-foreground">{{ formatMatchDate(row.createdAt) }}</span>
    </template>

    <template #actions="{ row }">
      <div class="flex items-center justify-end gap-2">
        <!-- <span
          v-for="seatNumber in playerSeats(row)"
          :key="seatNumber"
          class="grid size-6 place-items-center rounded-full bg-surface text-[10px] font-semibold text-muted-foreground ring-1 ring-inset ring-border"
          >{{ seatNumber }}</span
        > -->
        <Button v-if="isParticipant(row, props.currentUserId)" as-child size="sm">
          <RouterLink :to="{ name: 'MatchWaiting', params: { matchId: row.id } }">
            Ir a la sala
          </RouterLink>
        </Button>
        <Button
          v-else
          size="sm"
          :variant="availabilityOf(row).allowed ? 'default' : 'outline'"
          :disabled="!availabilityOf(row).allowed"
          @click="emit('join', row)"
        >
          {{ availabilityOf(row).allowed ? 'Unirse' : availabilityOf(row).reason }}
        </Button>
      </div>
    </template>
  </DataTable>
</template>
