<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { Eye, EyeOff, Sparkles, X } from '@lucide/vue'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { Button } from '@/shared/ui/components/button'
  import { Input } from '@/shared/ui/components/input'
  import { ConfigurationDataType, type GameDto } from '@/features/games/types'
  import { matchesApi } from '../api/matchesApi'
  import { generatePassword } from '../lib/presentation'
  import { MatchVisibility, type MatchDto } from '../types'

  const props = defineProps<{ game: GameDto }>()
  const emit = defineEmits<{
    created: [match: MatchDto]
    cancel: []
  }>()

  const visibility = ref<MatchVisibility>(MatchVisibility.Public)
  const password = ref('')
  const showPassword = ref(false)
  const seat = ref(1)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})
  const configValues = reactive<Record<number, string>>({})

  const isPrivate = computed(() => visibility.value === MatchVisibility.Private)
  const seatOptions = computed(() =>
    Array.from({ length: props.game.maxPlayers ?? 8 }, (_, index) => index + 1),
  )
  const missingRequiredConfigurations = computed(() =>
    props.game.configurations.filter(
      (configuration) =>
        configuration.required && !String(configValues[configuration.id] ?? '').trim(),
    ),
  )

  function initialConfigurationValue(configuration: GameDto['configurations'][number]): string {
    if (configuration.defaultValue !== null) return configuration.defaultValue
    if (
      configuration.required &&
      configuration.dataType === ConfigurationDataType.Select &&
      configuration.options.length > 0
    ) {
      const firstOption = configuration.options[0]
      if (firstOption) return String(firstOption.id)
    }
    return ''
  }

  function resetForm() {
    visibility.value = MatchVisibility.Public
    password.value = ''
    showPassword.value = false
    seat.value = 1
    error.value = null
    fieldErrors.value = {}

    for (const key of Object.keys(configValues)) delete configValues[Number(key)]
    for (const configuration of props.game.configurations) {
      configValues[configuration.id] = initialConfigurationValue(configuration)
    }
  }

  function generateNewPassword() {
    password.value = generatePassword()
    showPassword.value = true
    fieldErrors.value = { ...fieldErrors.value, password: '' }
  }

  function buildConfigurations() {
    return props.game.configurations
      .filter((configuration) => String(configValues[configuration.id] ?? '').trim() !== '')
      .map((configuration) => ({
        gameConfigurationId: configuration.id,
        value: String(configValues[configuration.id]).trim(),
      }))
  }

  async function submit() {
    error.value = null
    fieldErrors.value = {}

    if (isPrivate.value && !password.value.trim()) {
      fieldErrors.value = { password: 'Ingresá una contraseña o generá una.' }
      return
    }

    if (missingRequiredConfigurations.value.length > 0) {
      error.value = 'Completá las opciones obligatorias de la partida.'
      return
    }

    submitting.value = true
    try {
      const match = await matchesApi.createCustom({
        gameId: props.game.id,
        visibility: visibility.value,
        password: isPrivate.value ? password.value.trim() : null,
        seat: seat.value,
        configurations: buildConfigurations(),
      })
      emit('created', match)
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      fieldErrors.value = normalized.fieldErrors
      error.value = normalized.fieldErrors.password
        ? null
        : (normalized.message ?? 'No pudimos crear la partida.')
    } finally {
      submitting.value = false
    }
  }

  watch(() => props.game.id, resetForm, { immediate: true })
</script>

<template>
  <form
    class="rounded-xl border border-border bg-card p-4 sm:p-5"
    aria-labelledby="create-match-heading"
    @submit.prevent="submit"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 id="create-match-heading" class="text-lg font-bold tracking-[-0.02em]">
          Crear partida
        </h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Elegí la visibilidad y el asiento inicial. Después vas a poder compartir el enlace de
          invitación desde la sala de espera.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Cerrar"
        @click="emit('cancel')"
      >
        <X :size="16" />
      </Button>
    </div>

    <div class="mt-5 grid gap-5 sm:grid-cols-2">
      <fieldset>
        <legend class="text-sm font-semibold">Visibilidad</legend>
        <div class="mt-2 grid gap-2">
          <label
            :class="[
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              visibility === MatchVisibility.Public
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50',
            ]"
          >
            <input
              v-model="visibility"
              type="radio"
              name="match-visibility"
              :value="MatchVisibility.Public"
              class="mt-0.5 accent-primary"
            />
            <span>
              <span class="block text-sm font-semibold">Pública</span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                Cualquiera puede verla y unirse sin contraseña.
              </span>
            </span>
          </label>

          <label
            :class="[
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              visibility === MatchVisibility.Private
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50',
            ]"
          >
            <input
              v-model="visibility"
              type="radio"
              name="match-visibility"
              :value="MatchVisibility.Private"
              class="mt-0.5 accent-primary"
            />
            <span>
              <span class="block text-sm font-semibold">Privada</span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                Aparece en el listado, pero para unirse hace falta la contraseña o el enlace de
                invitación.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label for="match-seat" class="text-sm font-semibold">Tu asiento</label>
        <select
          id="match-seat"
          v-model.number="seat"
          class="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
        >
          <option v-for="option in seatOptions" :key="option" :value="option">
            Asiento {{ option }}
          </option>
        </select>
        <p class="mt-1 text-xs text-muted-foreground">
          Podés elegir otro asiento mientras haya lugar.
        </p>
        <p v-if="game.maxPlayers === null" class="mt-1 text-xs text-muted-foreground">
          Este juego no define un máximo; por ahora se ofrecen hasta 8 asientos.
        </p>
      </div>
    </div>

    <div v-if="isPrivate" class="mt-5 rounded-lg border border-border bg-surface/60 p-3.5">
      <label for="match-password" class="text-sm font-semibold">Contraseña</label>
      <div class="mt-2 flex flex-wrap gap-2">
        <Input
          id="match-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Contraseña para unirse"
          class="min-w-40 flex-1"
          :aria-invalid="!!fieldErrors.password"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          @click="showPassword = !showPassword"
        >
          <EyeOff v-if="showPassword" :size="16" />
          <Eye v-else :size="16" />
        </Button>
        <Button type="button" variant="outline" @click="generateNewPassword">
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

    <div v-if="game.configurations.length" class="mt-5">
      <h4 class="text-sm font-semibold">Opciones de la partida</h4>
      <div class="mt-2 grid gap-4 sm:grid-cols-2">
        <div v-for="configuration in game.configurations" :key="configuration.id">
          <label :for="`match-config-${configuration.id}`" class="text-sm font-medium">
            {{ configuration.displayName }}
            <span v-if="configuration.required" class="text-danger" aria-hidden="true">*</span>
          </label>
          <p v-if="configuration.description" class="mt-0.5 text-xs text-muted-foreground">
            {{ configuration.description }}
          </p>

          <select
            v-if="configuration.dataType === ConfigurationDataType.Select"
            :id="`match-config-${configuration.id}`"
            v-model="configValues[configuration.id]"
            class="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
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
            :id="`match-config-${configuration.id}`"
            v-model="configValues[configuration.id]"
            class="mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
          >
            <option value="">Predeterminado</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>

          <Input
            v-else
            :id="`match-config-${configuration.id}`"
            :model-value="configValues[configuration.id]"
            :type="configuration.dataType === ConfigurationDataType.Integer ? 'number' : 'text'"
            class="mt-2"
            @update:model-value="configValues[configuration.id] = String($event)"
          />
        </div>
      </div>
    </div>

    <p v-if="error" role="alert" class="mt-4 text-sm font-medium text-danger">{{ error }}</p>

    <div class="mt-5 flex flex-wrap gap-2">
      <Button type="submit" :disabled="submitting">
        {{ submitting ? 'Creando…' : 'Crear partida' }}
      </Button>
      <Button type="button" variant="ghost" :disabled="submitting" @click="emit('cancel')">
        Cancelar
      </Button>
    </div>
  </form>
</template>
