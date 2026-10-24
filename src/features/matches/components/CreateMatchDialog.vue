<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
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
  import { useZodForm, type ZodFormApi } from '@/shared/composables/useZodForm'
  import { matchesApi } from '../api/matchesApi'
  import { generatePassword } from '../lib/presentation'
  import { MatchVisibility, type MatchConfigurationRequest, type MatchDto } from '../types'
  import { createMatchFormSchema, type CreateMatchFormValues } from '../schemas'

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
  const showPassword = ref(false)

  const form: ZodFormApi<CreateMatchFormValues> = useZodForm<CreateMatchFormValues>(
    // el contexto (configuraciones obligatorias) sale del juego elegido al enviar
    () => createMatchFormSchema(requiredConfigurationIds.value),
    {
      gameId: props.game?.id ?? null,
      visibility: MatchVisibility.Public,
      seat: null,
      password: '',
      configurationValues: {},
    },
  )
  const { values, errors, formError, submitting, handleSubmit } = form

  /** Juego elegido en el formulario. */
  const selectedGame = computed(() => games.value.find((g) => g.id === values.gameId) ?? null)

  const requiredConfigurationIds = computed(() =>
    (selectedGame.value?.configurations ?? [])
      .filter((configuration) => configuration.required)
      .map((configuration) => configuration.id),
  )

  const isPrivate = computed(() => values.visibility === MatchVisibility.Private)

  const seatOptions = computed(() =>
    selectedGame.value
      ? Array.from({ length: selectedGame.value.maxPlayers ?? 8 }, (_, index) => index + 1)
      : [],
  )

  async function loadGames() {
    if (props.game) {
      games.value = [props.game]
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
    values.gameId = props.game?.id ?? null
    values.visibility = MatchVisibility.Public
    values.seat = null
    values.password = ''
    showPassword.value = false
    formError.value = null
    errors.value = {}
    for (const key of Object.keys(values.configurationValues)) {
      delete values.configurationValues[key]
    }
  }

  function buildConfigurations(): MatchConfigurationRequest[] {
    const entries: MatchConfigurationRequest[] = []
    for (const configuration of selectedGame.value?.configurations ?? []) {
      const value = values.configurationValues[String(configuration.id)] ?? ''
      if (value.trim() !== '') {
        entries.push({ gameConfigurationId: configuration.id, value: value.trim() })
      }
    }
    return entries
  }

  function generateNewPassword() {
    values.password = generatePassword()
    showPassword.value = true
    delete errors.value.password
  }

  function setConfigurationValue(id: number, value: unknown) {
    values.configurationValues[String(id)] = value === null ? '' : String(value)
  }

  const submit = handleSubmit(async (data) => {
    if (data.gameId === null || data.seat === null) return // descartado por el schema
    const visibility = data.visibility as MatchVisibility // validado contra el enum por la UI
    const match = await matchesApi.createCustom({
      gameId: data.gameId,
      visibility,
      password: visibility === MatchVisibility.Private ? data.password.trim() : null,
      seat: data.seat,
      configurations: buildConfigurations(),
    })
    emit('created', match)
    emit('update:open', false)
  })

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        resetForm()
        void loadGames()
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
        <DialogDescription v-if="props.game">
          Partida para {{ props.game.displayName }}: elegí la visibilidad y las opciones.
        </DialogDescription>
        <DialogDescription v-else>
          Elegí el juego, la visibilidad y las opciones de la sala.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="submit" class="mt-5 space-y-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <div v-if="!props.game">
            <div class="text-sm font-semibold">Juego</div>
            <Select v-model="values.gameId" :disabled="gamesLoading">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Elegí un juego" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="g in games" :key="g.id" :value="g.id">
                  <SelectItemText>{{ g.displayName }}</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
            <p
              v-if="errors.gameId || (!values.gameId && !gamesLoading)"
              class="mt-1 text-xs font-medium text-danger"
            >
              {{ errors.gameId ?? 'Elegí un juego.' }}
            </p>
          </div>

          <div>
            <div class="text-sm font-semibold">Visibilidad</div>
            <Select v-model="values.visibility" :disabled="!values.gameId || gamesLoading">
              <SelectTrigger class="w-full">
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
            <Select v-model="values.seat" :disabled="!values.gameId || gamesLoading">
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="selectedGame ? 'Elegí un asiento' : 'Elegí un juego primero'"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in seatOptions" :key="option" :value="option">
                  <SelectItemText>Asiento {{ option }}</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.seat" class="mt-1 text-xs font-medium text-danger">{{ errors.seat }}</p>
            <p
              v-else-if="selectedGame?.maxPlayers === null"
              class="mt-1 text-xs text-muted-foreground"
            >
              Este juego no define un máximo; por ahora se ofrecen hasta 8 asientos.
            </p>
          </div>
        </div>

        <div v-if="isPrivate" class="rounded-lg border border-border bg-surface/60 p-3.5">
          <div class="text-sm font-semibold">Contraseña</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <Input
              id="dialog-match-password"
              v-model="values.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Contraseña para unirse"
              class="min-w-40 flex-1"
              :aria-invalid="!!errors.password"
              :disabled="!values.gameId || gamesLoading"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :disabled="!values.gameId || gamesLoading"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="16" />
              <Eye v-else :size="16" />
            </Button>
            <Button
              type="button"
              variant="outline"
              :disabled="!values.gameId || gamesLoading"
              @click="generateNewPassword"
            >
              <Sparkles :size="16" data-icon="inline-start" /> Generar
            </Button>
          </div>
          <p v-if="errors.password" class="mt-1.5 text-xs font-medium text-danger">
            {{ errors.password }}
          </p>
          <p class="mt-1.5 text-xs text-muted-foreground">
            El enlace de invitación permite entrar sin escribir la contraseña.
          </p>
        </div>

        <div v-if="selectedGame?.configurations.length" class="mt-1">
          <h4 class="text-sm font-semibold">Opciones de la partida</h4>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <div
              v-for="configuration in selectedGame.configurations"
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

              <Select
                v-if="configuration.dataType === ConfigurationDataType.Select"
                :model-value="values.configurationValues[String(configuration.id)]"
                class="mt-2"
                :disabled="gamesLoading"
                @update:model-value="setConfigurationValue(configuration.id, $event)"
              >
                <SelectTrigger :id="`dialog-config-${configuration.id}`" class="w-full">
                  <SelectValue
                    :placeholder="configuration.required ? 'Elegí una opción' : 'Predeterminado'"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in configuration.options"
                    :key="option.id"
                    :value="String(option.id)"
                  >
                    <SelectItemText>{{ option.displayName }}</SelectItemText>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                v-else-if="configuration.dataType === ConfigurationDataType.Boolean"
                :model-value="values.configurationValues[String(configuration.id)]"
                class="mt-2"
                :disabled="gamesLoading"
                @update:model-value="setConfigurationValue(configuration.id, $event)"
              >
                <SelectTrigger :id="`dialog-config-${configuration.id}`" class="w-full">
                  <SelectValue placeholder="Predeterminado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">
                    <SelectItemText>Sí</SelectItemText>
                  </SelectItem>
                  <SelectItem value="false">
                    <SelectItemText>No</SelectItemText>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                v-else
                :id="`dialog-config-${configuration.id}`"
                :model-value="values.configurationValues[String(configuration.id)]"
                :type="configuration.dataType === ConfigurationDataType.Integer ? 'number' : 'text'"
                class="mt-2"
                :disabled="gamesLoading"
                @update:model-value="setConfigurationValue(configuration.id, $event)"
              />
            </div>
          </div>
          <p
            v-if="errors.configurationValues"
            class="mt-2 text-xs font-medium text-danger"
            role="alert"
          >
            {{ errors.configurationValues }}
          </p>
        </div>

        <p v-if="formError" role="alert" class="mt-2 text-sm font-medium text-danger">
          {{ formError }}
        </p>

        <div class="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            :disabled="submitting"
            @click="emit('update:open', false)"
          >
            Cancelar
          </Button>
          <Button type="submit" :disabled="submitting || !values.gameId">
            {{ submitting ? 'Creando…' : 'Crear partida' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
