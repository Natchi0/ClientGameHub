<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { Eye, EyeOff, Sparkles } from '@lucide/vue'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { gamesApi } from '@/features/games/api/gamesApi'
  import type { GameDto } from '@/features/games/types'
  import { ConfigurationDataType } from '@/features/games/types'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/shared/ui/components/dialog'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectItemText,
    SelectTrigger,
    SelectValue,
  } from '@/shared/ui/components/select'
  import { Button } from '@/shared/ui/components/button'
  import { Input } from '@/shared/ui/components/input'
  import { matchesApi } from '../api/matchesApi'
  import { generatePassword } from '../lib/presentation'
  import { MatchVisibility, type MatchDto } from '../types'

  const props = defineProps<{
    open: boolean
    /** Juego preseleccionado al crear desde la vista de un juego concreto. */
    game?: GameDto
  }>()

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'created', value: MatchDto): void
  }>()

  const games = ref<GameDto[]>([])
  const gamesLoading = ref(false)
  const gamesError = ref<string | null>(null)

  const gameId = ref<number | null>(null)
  const visibility = ref<MatchVisibility>(MatchVisibility.Public)
  const seat = ref<string | null>(null)
  const password = ref('')
  const showPassword = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})
  const configValues = reactive<Record<number, string>>({})

  const game = computed(() => games.value.find((g) => g.id === gameId.value) ?? null)

  const isPrivate = computed(() => visibility.value === MatchVisibility.Private)

  const seatOptions = computed(() =>
    game.value ? Array.from({ length: game.value.maxPlayers ?? 8 }, (_, index) => index + 1) : [],
  )

  const missingRequiredConfigurations = computed(
    () =>
      game.value?.configurations.filter(
        (configuration) =>
          configuration.required && !String(configValues[configuration.id] ?? '').trim(),
      ) ?? [],
  )

  const canCreate = computed(() => !!game.value && !submitting.value)

  async function loadGames() {
    if (props.game) {
      games.value = [props.game]
      gameId.value = props.game.id
      return
    }
    gamesLoading.value = true
    gamesError.value = null
    try {
      games.value = await gamesApi.index()
    } catch (caught) {
      gamesError.value = normalizeApiError(caught).message ?? 'No se pudieron cargar los juegos.'
    } finally {
      gamesLoading.value = false
    }
  }

  function resetForm() {
    gameId.value = null
    visibility.value = MatchVisibility.Public
    seat.value = null
    password.value = ''
    showPassword.value = false
    error.value = null
    fieldErrors.value = {}
    for (const key of Object.keys(configValues)) delete configValues[Number(key)]
  }

  function buildConfigurations() {
    return (
      game.value?.configurations
        .filter((configuration) => String(configValues[configuration.id] ?? '').trim() !== '')
        .map((configuration) => ({
          gameConfigurationId: configuration.id,
          value: String(configValues[configuration.id]).trim(),
        })) ?? []
    )
  }

  function generateNewPassword() {
    password.value = generatePassword()
    showPassword.value = true
    fieldErrors.value = { ...fieldErrors.value, password: '' }
  }

  async function submit() {
    error.value = null
    fieldErrors.value = {}

    if (!gameId.value) {
      fieldErrors.value = { game: 'Elegí un juego.' }
      return
    }

    if (isPrivate.value && !password.value.trim()) {
      fieldErrors.value = { password: 'Ingresá una contraseña o generá una.' }
      return
    }

    if (!seat.value) {
      fieldErrors.value = { seat: 'Elegí un asiento.' }
      return
    }

    if (missingRequiredConfigurations.value.length > 0) {
      error.value = 'Completá las opciones obligatorias de la partida.'
      return
    }

    submitting.value = true
    try {
      const match = await matchesApi.createCustom({
        gameId: gameId.value,
        visibility: visibility.value,
        password: isPrivate.value ? password.value.trim() : null,
        seat: seat.value ? Number(seat.value) : undefined,
        configurations: buildConfigurations(),
      })
      emit('created', match)
      emit('update:open', false)
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      fieldErrors.value = normalized.fieldErrors
      error.value = normalized.fieldErrors.password
        ? null
        : (normalized.message ?? 'No se pudo crear la partida.')
    } finally {
      submitting.value = false
    }
  }

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        void loadGames()
        resetForm()
      }
    },
    { immediate: true },
  )
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Crear partida</DialogTitle>
        <DialogDescription>
          Elegí el juego, la visibilidad y las opciones de la sala.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="submit" class="mt-5 space-y-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <div class="text-sm font-semibold">Juego</div>
            <Select v-model="gameId" class="w-full" :disabled="gamesLoading">
              <SelectTrigger>
                <SelectValue placeholder="Elegí un juego" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="g in games" :key="g.id" :value="g.id">
                  <SelectItemText>{{ g.displayName }}</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="!gameId && !gamesLoading" class="mt-1 text-xs font-medium text-danger">
              Elegí un juego.
            </p>
          </div>

          <div>
            <div class="text-sm font-semibold">Visibilidad</div>
            <Select v-model="visibility" class="w-full" :disabled="!gameId || gamesLoading">
              <SelectTrigger>
                <SelectValue placeholder="Elegí una visibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="MatchVisibility.Public">
                  <SelectItemText>Pública</SelectItemText>
                </SelectItem>
                <SelectItem :value="MatchVisibility.Private">
                  <SelectItemText>Privada</SelectItemText>
                </SelectItem>
                <SelectItem :value="MatchVisibility.FriendsOnly">
                  <SelectItemText>Solo amigos</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div class="text-sm font-semibold">Tu asiento</div>
            <Select v-model="seat" class="w-full" :disabled="!gameId || gamesLoading">
              <SelectTrigger>
                <SelectValue
                  :placeholder="game ? `Asiento ${seat || 1}` : 'Elegí un juego primero'"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in seatOptions" :key="option" :value="option">
                  <SelectItemText>Asiento {{ option }}</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="game?.maxPlayers === null" class="mt-1 text-xs text-muted-foreground">
              Este juego no define un máximo; por ahora se ofrecen hasta 8 asientos.
            </p>
          </div>
        </div>

        <div v-if="isPrivate" class="rounded-lg border border-border bg-surface/60 p-3.5">
          <div class="text-sm font-semibold">Contraseña</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <Input
              id="dialog-match-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Contraseña para unirse"
              class="min-w-40 flex-1"
              :aria-invalid="!!fieldErrors.password"
              :disabled="!gameId || gamesLoading"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :disabled="!gameId || gamesLoading"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="16" />
              <Eye v-else :size="16" />
            </Button>
            <Button
              type="button"
              variant="outline"
              :disabled="!gameId || gamesLoading"
              @click="generateNewPassword"
            >
              <Sparkles :size="16" data-icon="inline-start" /> Generar
            </Button>
          </div>
          <p v-if="fieldErrors.password" class="mt-1.5 text-xs font-medium text-danger">
            {{ fieldErrors.password }}
          </p>
          <p class="mt-1.5 text-xs text-muted-foreground">
            El enlace de invitación permite entrar sin escribir la contraseña.
          </p>
        </div>

        <div v-if="game?.configurations.length" class="mt-1">
          <h4 class="text-sm font-semibold">Opciones de la partida</h4>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <div
              v-for="configuration in game.configurations"
              :key="configuration.id"
              class="space-y-1"
            >
              <label :for="`dialog-config-${configuration.id}`" class="text-sm font-medium">
                {{ configuration.displayName }}
                <span v-if="configuration.required" class="text-danger" aria-hidden="true">*</span>
              </label>
              <p v-if="configuration.description" class="mt-0.5 text-xs text-muted-foreground">
                {{ configuration.description }}
              </p>

              <select
                v-if="configuration.dataType === ConfigurationDataType.Select"
                :id="`dialog-config-${configuration.id}`"
                v-model="configValues[configuration.id]"
                class="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
                :disabled="gamesLoading"
              >
                <option value="">
                  {{ configuration.required ? 'Elegí una opción' : 'Predeterminado' }}
                </option>
                <option
                  v-for="option in configuration.options"
                  :key="option.id"
                  :value="String(option.id)"
                >
                  {{ option.displayName }}
                </option>
              </select>

              <select
                v-else-if="configuration.dataType === ConfigurationDataType.Boolean"
                :id="`dialog-config-${configuration.id}`"
                v-model="configValues[configuration.id]"
                class="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
                :disabled="gamesLoading"
              >
                <option value="">Predeterminado</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>

              <Input
                v-else
                :id="`dialog-config-${configuration.id}`"
                :model-value="configValues[configuration.id]"
                :type="configuration.dataType === ConfigurationDataType.Integer ? 'number' : 'text'"
                class="mt-2"
                :disabled="gamesLoading"
                @update:model-value="configValues[configuration.id] = String($event)"
              />
            </div>
          </div>
        </div>

        <p v-if="error" role="alert" class="mt-2 text-sm font-medium text-danger">{{ error }}</p>

        <div class="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            :disabled="submitting || !gameId || !seat"
            @click="emit('update:open', false)"
          >
            Cancelar
          </Button>
          <Button type="submit" :disabled="submitting || !canCreate">
            {{ submitting ? 'Creando…' : 'Crear partida' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
