<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { Camera, UserPlus } from '@lucide/vue'
  import { RouterLink } from 'vue-router'
  import UserAvatar from '@/shared/ui/UserAvatar.vue'
  import { Button } from '@/shared/ui/components/button'
  import BaseInput from '@/shared/ui/BaseInput.vue'
  import { useZodForm } from '@/shared/composables/useZodForm'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import { nicknameSchema } from '../schemas'

  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB
  const MAX_DIMENSION = 4096
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

  const auth = useAuthStore()

  const user = computed(() => auth.user)
  const isGuest = computed(() => auth.isGuest)
  const nickname = computed(() => user.value?.nickname ?? '')
  const avatar = computed(() => user.value?.avatar ?? null)
  const email = computed(() => user.value?.email ?? null)
  const statusLabel = computed(() => (isGuest.value ? 'Invitado' : 'Jugador'))

  const avatarFile = ref<File | null>(null)
  const avatarPreview = ref<string | null>(null)
  const avatarError = ref<string | null>(null)
  const uploading = ref(false)
  const avatarInput = ref<HTMLInputElement | null>(null)

  const { values, errors, formError, submitting, validateField, handleSubmit } = useZodForm(
    nicknameSchema,
    { nickname: nickname.value },
  )

  const canSaveNickname = computed(
    () => !submitting.value && values.nickname.trim() !== nickname.value,
  )

  const fileSizeLabel = computed(() => {
    if (!avatarFile.value) return ''
    const mb = avatarFile.value.size / (1024 * 1024)
    return mb >= 0.1
      ? `${mb.toFixed(1)} MB`
      : `${Math.max(1, Math.round(avatarFile.value.size / 1024))} KB`
  })

  onMounted(async () => {
    if (!user.value) {
      await auth.fetchUser()
      values.nickname = nickname.value
    }
  })

  function revokePreview() {
    if (avatarPreview.value) {
      URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = null
    }
  }

  function openAvatarPicker() {
    avatarInput.value?.click()
  }

  function cancelAvatar() {
    avatarFile.value = null
    avatarError.value = null
    revokePreview()
    if (avatarInput.value) avatarInput.value.value = ''
  }

  function handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0] ?? null
    revokePreview()
    avatarFile.value = null
    avatarError.value = null

    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
      avatarError.value = 'Elegí una imagen JPG, PNG o WebP.'
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      avatarError.value = 'La imagen no puede superar los 4 MB.'
      return
    }

    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }

  type DimensionCheck = 'ok' | 'too-large' | 'unreadable'

  async function validateImageDimensions(file: File): Promise<DimensionCheck> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION ? 'ok' : 'too-large')
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve('unreadable')
      }
      img.src = url
    })
  }

  async function onUploadAvatar() {
    if (!avatarFile.value || uploading.value) return
    avatarError.value = null
    try {
      const dimensionCheck = await validateImageDimensions(avatarFile.value)
      if (dimensionCheck === 'too-large') {
        avatarError.value = `La imagen no puede superar los ${MAX_DIMENSION}×${MAX_DIMENSION} px.`
        return
      }
      if (dimensionCheck === 'unreadable') {
        avatarError.value = 'No pudimos leer la imagen. Probá con otro archivo.'
        return
      }
      uploading.value = true
      await auth.uploadAvatar(avatarFile.value)
      avatarFile.value = null
      revokePreview()
      if (avatarInput.value) avatarInput.value.value = ''
    } catch (e) {
      const n = normalizeApiError(e)
      avatarError.value = n.message || 'No se pudo subir la foto. Intentá de nuevo.'
    } finally {
      uploading.value = false
    }
  }

  const onSaveNickname = handleSubmit(async (data) => {
    await auth.updateNickname(data.nickname)
    values.nickname = user.value?.nickname ?? ''
  })
</script>

<template>
  <div class="mx-auto w-full max-w-4xl space-y-8">
    <header class="space-y-1.5">
      <h1 class="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Tu perfil</h1>
      <p class="text-sm text-muted-foreground">
        Gestioná tu identidad, tu foto y los datos de tu cuenta.
      </p>
    </header>

    <!-- Registro pendiente: se obliga a registrarse si todavía es invitado -->
    <section
      v-if="isGuest"
      class="flex flex-col gap-4 rounded-xl border border-accent bg-accent/30 p-5 text-accent-foreground sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="guest-register-heading"
    >
      <div class="flex gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
          aria-hidden="true"
        >
          <UserPlus :size="18" />
        </span>
        <div>
          <h2 id="guest-register-heading" class="font-semibold">Terminá tu registro</h2>
          <p class="mt-1 max-w-prose text-sm text-accent-foreground/80">
            Tu perfil de invitado es temporal y tus datos pueden perderse. Creá una cuenta para
            conservar tu apodo y tu foto, y poder jugar desde cualquier dispositivo.
          </p>
        </div>
      </div>
      <Button as-child class="shrink-0 self-start sm:self-auto">
        <RouterLink to="/register">Crear cuenta</RouterLink>
      </Button>
    </section>

    <!-- Resumen de identidad -->
    <section class="rounded-xl bg-surface p-6 sm:p-8" aria-labelledby="identity-heading">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div class="shrink-0 self-center sm:self-start">
          <UserAvatar :src="avatarPreview ?? avatar" :name="nickname" size="lg" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2.5">
            <h2
              id="identity-heading"
              class="min-w-0 truncate font-heading text-2xl font-bold tracking-[-0.03em]"
            >
              {{ nickname }}
            </h2>
            <span
              :class="[
                'rounded-md px-2 py-0.5 text-xs font-semibold',
                isGuest ? 'bg-accent text-accent-foreground' : 'bg-primary/15 text-primary',
              ]"
            >
              {{ statusLabel }}
            </span>
          </div>

          <dl class="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div class="flex min-w-0 items-baseline gap-2">
              <dt class="shrink-0 text-muted-foreground">Email</dt>
              <dd class="min-w-0 truncate font-medium">{{ email ?? 'No asociado' }}</dd>
            </div>
            <div class="flex min-w-0 items-baseline gap-2">
              <dt class="shrink-0 text-muted-foreground">Cuenta</dt>
              <dd class="font-medium">{{ isGuest ? 'Sin registrar' : 'Registrada' }}</dd>
            </div>
          </dl>

          <div class="mt-5 border-t border-border pt-5">
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              aria-label="Elegir foto de perfil"
              @change="handleAvatarChange"
            />
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" :disabled="uploading" @click="openAvatarPicker">
                <Camera :size="16" /> Cambiar foto
              </Button>
              <template v-if="avatarFile">
                <Button size="sm" :disabled="uploading" @click="onUploadAvatar">
                  {{ uploading ? 'Subiendo…' : 'Guardar foto' }}
                </Button>
                <Button size="sm" variant="ghost" :disabled="uploading" @click="cancelAvatar">
                  Cancelar
                </Button>
              </template>
            </div>
            <p v-if="avatarFile" class="mt-2 truncate text-xs text-muted-foreground">
              {{ avatarFile.name }} · {{ fileSizeLabel }}
            </p>
            <p v-else class="mt-2 text-xs text-muted-foreground">
              JPG, PNG o WebP. Hasta 4 MB y 4096×4096 px.
            </p>
            <p v-if="avatarError" class="mt-2 text-sm text-danger" role="alert">
              {{ avatarError }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Edición de apodo -->
    <section
      class="rounded-xl border border-border bg-card p-6 sm:p-8"
      aria-labelledby="nickname-heading"
    >
      <div class="max-w-md">
        <h2 id="nickname-heading" class="text-lg font-semibold tracking-[-0.02em]">Apodo</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Es el nombre con el que te ven los demás jugadores.
        </p>
        <form class="mt-5 space-y-4" novalidate @submit.prevent="onSaveNickname">
          <BaseInput
            v-model="values.nickname"
            label="Apodo"
            :error="errors.nickname"
            autocomplete="nickname"
            @blur="validateField('nickname')"
          />
          <p
            v-if="formError"
            class="rounded-md bg-danger-surface px-3 py-2.5 text-sm text-danger"
            role="alert"
          >
            {{ formError }}
          </p>
          <Button type="submit" :disabled="!canSaveNickname">
            {{ submitting ? 'Guardando…' : 'Guardar apodo' }}
          </Button>
        </form>
      </div>
    </section>
  </div>
</template>
