<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { isAxiosError } from 'axios'
  import { Lock, Users } from '@lucide/vue'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/shared/ui/components/dialog'
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
  import { matchesApi } from '../api/matchesApi'
  import { availableSeats } from '../lib/presentation'
  import { MatchVisibility, ParticipantType, type MatchDto } from '../types'
  import type { GameDto } from '@/features/games/types'

  const props = defineProps<{
    open: boolean
    match: MatchDto | null
    game: GameDto | null
  }>()

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'joined', value: MatchDto): void
  }>()

  const seat = ref<number | null>(null)
  const password = ref('')
  const joining = ref(false)
  const joinError = ref<string | null>(null)

  const privateMatch = computed(() => props.match?.visibility === MatchVisibility.Private)
  const seats = computed(() =>
    props.match && props.game ? availableSeats(props.match, props.game.maxPlayers) : [],
  )
  const hasSeats = computed(() => seats.value.length > 0)

  function resetForm() {
    seat.value = seats.value[0] ?? null
    password.value = ''
    joinError.value = null
  }

  async function join() {
    if (!props.match || seat.value === null) return
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
      else joinError.value = normalizeApiError(caught).message ?? 'No se pudo unir a la partida.'
    } finally {
      joining.value = false
    }
  }

  watch(
    [() => props.open, () => props.match, () => props.game],
    () => {
      if (props.open) resetForm()
    },
    { deep: true, immediate: true },
  )
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Unirse a la partida</DialogTitle>
        <DialogDescription> Elegí el asiento y, si es privada, la contraseña. </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="join" class="mt-5 space-y-4">
        <div>
          <div class="text-sm font-semibold">Asiento</div>
          <Select v-model="seat" class="w-full" :disabled="!hasSeats || joining">
            <SelectTrigger>
              <SelectValue placeholder="Asiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="available in seats" :key="available" :value="String(available)">
                <SelectItemText>Asiento {{ available }}</SelectItemText>
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="!hasSeats" class="mt-1 text-xs text-muted-foreground">
            No quedan asientos disponibles.
          </p>
        </div>

        <div v-if="privateMatch" class="rounded-lg border border-border bg-surface/60 p-3.5">
          <div class="flex items-center gap-2">
            <Lock :size="14" class="shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="text-sm font-semibold">Contraseña</span>
          </div>
          <Input
            id="dialog-join-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Contraseña de la partida"
            class="mt-2 w-full"
            :aria-invalid="!!joinError"
            :disabled="joining"
          />
          <p v-if="joinError" class="mt-1 text-xs font-medium text-danger">{{ joinError }}</p>
        </div>

        <div v-if="!privateMatch" class="text-sm text-muted-foreground">
          <Users :size="14" class="shrink-0 mr-1 text-muted-foreground" aria-hidden="true" />
          Partida pública: cualquiera puede unirse sin contraseña.
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            :disabled="joining || !seat"
            @click="emit('update:open', false)"
          >
            Cancelar
          </Button>
          <Button type="submit" :disabled="joining || !seat">
            {{ joining ? 'Uniendo…' : 'Unirse' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
