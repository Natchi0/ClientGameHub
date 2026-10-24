<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { isAxiosError } from 'axios'
  import { Lock, Users } from '@lucide/vue'
  import { toast } from 'vue-sonner'
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
  const router = useRouter()

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
      toast.success('Te uniste a la partida.')
      emit('joined', updated)
    } catch (caught) {
      const status = isAxiosError(caught) ? caught.response?.status : undefined
      const message =
        status === 401
          ? 'Contraseña incorrecta.'
          : (normalizeApiError(caught).message ?? 'No se pudo unir a la partida.')

      // El listado puede estar desactualizado; el backend lo confirma con 409
      // «El usuario ya participa en la partida.»: no hay nada que volver a intentar.
      if (status === 409 && message.includes('ya participa') && props.match) {
        toast.info('Ya participás en esta partida.')
        emit('update:open', false)
        void router.push({ name: 'MatchWaiting', params: { matchId: props.match.id } })
        return
      }

      joinError.value = message
      toast.error(message)
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
          <Select v-model="seat" :disabled="!hasSeats || joining">
            <SelectTrigger class="w-full">
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
