<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { isAxiosError } from 'axios'
  import { Globe, Lock, Users } from '@lucide/vue'
  import { RouterLink } from 'vue-router'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { Button } from '@/shared/ui/components/button'
  import { Input } from '@/shared/ui/components/input'
  import UserAvatar from '@/shared/ui/UserAvatar.vue'
  import type { GameDto } from '@/features/games/types'
  import { matchesApi } from '../api/matchesApi'
  import {
    availableSeats,
    capacityLabel,
    formatMatchDate,
    getJoinAvailability,
    isParticipant,
    isPrivateMatch,
    matchStatusLabel,
    matchVisibilityLabel,
    nextAvailableSeat,
    ownerParticipant,
  } from '../lib/presentation'
  import { MatchVisibility, ParticipantType, type MatchDto } from '../types'

  const props = defineProps<{
    game: GameDto
    match: MatchDto
    currentUserId: number | null
  }>()
  const emit = defineEmits<{ joined: [match: MatchDto] }>()

  const showJoin = ref(false)
  const seat = ref<number | null>(null)
  const password = ref('')
  const joining = ref(false)
  const joinError = ref<string | null>(null)

  const privateMatch = computed(() => isPrivateMatch(props.match))
  const friendsOnly = computed(() => props.match.visibility === MatchVisibility.FriendsOnly)
  const inMatch = computed(() => isParticipant(props.match, props.currentUserId))
  const owner = computed(() => ownerParticipant(props.match))
  const seats = computed(() => availableSeats(props.match, props.game.maxPlayers))
  const availability = computed(() =>
    getJoinAvailability(props.match, props.game.maxPlayers, props.currentUserId),
  )
  const visibleParticipants = computed(() => props.match.participants.slice(0, 4))
  const extraParticipants = computed(() =>
    Math.max(0, props.match.participants.length - visibleParticipants.value.length),
  )
  const participantNames = computed(() =>
    props.match.participants.map((participant) => participant.nickname).join(', '),
  )
  const capacity = computed(() => capacityLabel(props.match, props.game.maxPlayers))
  const joinLabel = computed(() => {
    if (inMatch.value) return 'Ir a la sala'
    if (availability.value.allowed) return 'Unirse'
    return availability.value.reason ?? 'No disponible'
  })

  function toggleJoin() {
    if (!availability.value.allowed) return

    showJoin.value = !showJoin.value
    joinError.value = null
    if (!showJoin.value) return

    seat.value = nextAvailableSeat(props.match, props.game.maxPlayers)
    password.value = ''
  }

  async function join() {
    if (seat.value === null) return
    if (privateMatch.value && !password.value.trim()) {
      joinError.value = 'Ingresá la contraseña para entrar.'
      return
    }

    joining.value = true
    joinError.value = null

    try {
      const updated = await matchesApi.join(props.match.id, {
        type: ParticipantType.Player,
        seat: seat.value,
        password: privateMatch.value ? password.value.trim() : null,
      })
      emit('joined', updated)
    } catch (caught) {
      if (isAxiosError(caught) && caught.response?.status === 401)
        joinError.value = 'Contraseña incorrecta.'
      else joinError.value = normalizeApiError(caught).message ?? 'No pudimos unirte a la partida.'
    } finally {
      joining.value = false
    }
  }
</script>

<template>
  <article class="p-4 sm:p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
          >
            <Lock v-if="privateMatch" :size="12" aria-hidden="true" />
            <Users v-else-if="friendsOnly" :size="12" aria-hidden="true" />
            <Globe v-else :size="12" aria-hidden="true" />
            {{ matchVisibilityLabel(match.visibility) }}
          </span>
          <span
            class="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground"
          >
            {{ matchStatusLabel(match.status) }}
          </span>
          <span class="text-xs text-muted-foreground">{{ formatMatchDate(match.createdAt) }}</span>
        </div>

        <p class="mt-2 text-sm font-semibold">
          {{ capacity }}
          <span v-if="owner" class="font-normal text-muted-foreground">
            · Anfitrión: {{ owner.nickname }}
          </span>
        </p>
        <p class="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {{ participantNames || 'Todavía no hay jugadores' }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <div class="flex -space-x-2" aria-hidden="true">
          <UserAvatar
            v-for="participant in visibleParticipants"
            :key="participant.id"
            :src="participant.avatar"
            :name="participant.nickname"
            size="sm"
            class="ring-2 ring-card"
          />
          <span
            v-if="extraParticipants > 0"
            class="grid size-8 place-items-center rounded-full bg-surface text-xs font-semibold text-muted-foreground ring-2 ring-card"
          >
            +{{ extraParticipants }}
          </span>
        </div>

        <Button v-if="inMatch" as-child size="sm">
          <RouterLink :to="{ name: 'MatchWaiting', params: { matchId: match.id } }">
            {{ joinLabel }}
          </RouterLink>
        </Button>
        <Button
          v-else
          size="sm"
          :variant="availability.allowed ? 'default' : 'outline'"
          :disabled="!availability.allowed || joining"
          :aria-expanded="showJoin"
          @click="toggleJoin"
        >
          {{ joinLabel }}
        </Button>
      </div>
    </div>

    <div v-if="privateMatch && !inMatch" class="mt-2 text-xs text-muted-foreground">
      Se necesita la contraseña o un enlace de invitación para entrar.
    </div>

    <form
      v-if="showJoin && availability.allowed"
      :class="[
        'mt-4 grid gap-3 rounded-lg border border-border bg-surface/60 p-3.5 sm:items-end',
        privateMatch
          ? 'sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]'
          : 'sm:grid-cols-[minmax(0,10rem)_auto]',
      ]"
      @submit.prevent="join"
    >
      <div>
        <label :for="`join-seat-${match.id}`" class="text-xs font-semibold">Asiento</label>
        <select
          :id="`join-seat-${match.id}`"
          v-model.number="seat"
          class="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
        >
          <option v-for="availableSeat in seats" :key="availableSeat" :value="availableSeat">
            Asiento {{ availableSeat }}
          </option>
        </select>
      </div>

      <div v-if="privateMatch">
        <label :for="`join-password-${match.id}`" class="text-xs font-semibold"> Contraseña </label>
        <Input
          :id="`join-password-${match.id}`"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Contraseña de la partida"
          class="mt-1"
        />
      </div>

      <div class="flex gap-2 sm:justify-end">
        <Button type="submit" size="sm" :disabled="joining">
          {{ joining ? 'Entrando…' : 'Confirmar' }}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          :disabled="joining"
          @click="showJoin = false"
        >
          Cancelar
        </Button>
      </div>

      <p v-if="joinError" role="alert" class="text-sm font-medium text-danger sm:col-span-full">
        {{ joinError }}
      </p>
    </form>
  </article>
</template>
