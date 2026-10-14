<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import BaseInput from '@/shared/ui/BaseInput.vue'
  import { useZodForm } from '@/shared/composables/useZodForm'
  import { useAuthStore } from '../stores/authStore'
  import { registerSchema } from '../schemas'

  const auth = useAuthStore()
  const router = useRouter()

  const { values, errors, formError, submitting, validateField, handleSubmit } = useZodForm(
    registerSchema,
    { nickname: auth.user?.nickname ?? '', email: '', password: '', confirmPassword: '' },
  )

  const onSubmit = handleSubmit(async ({ confirmPassword, ...payload }) => {
    await auth.register(payload) // confirmPassword no se envía
    await router.push('/')
  })
</script>

<template>
  <form class="mx-auto mt-16 max-w-sm space-y-4" novalidate @submit.prevent="onSubmit">
    <h1 class="text-2xl font-bold">Crear cuenta</h1>

    <BaseInput
      v-model="values.nickname"
      label="Nickname"
      :error="errors.nickname"
      @blur="validateField('nickname')"
    />
    <BaseInput
      v-model="values.email"
      label="Email"
      type="email"
      autocomplete="email"
      :error="errors.email"
      @blur="validateField('email')"
    />
    <BaseInput
      v-model="values.password"
      label="Contraseña"
      type="password"
      autocomplete="new-password"
      :error="errors.password"
      @blur="validateField('password')"
    />
    <BaseInput
      v-model="values.confirmPassword"
      label="Repetir contraseña"
      type="password"
      autocomplete="new-password"
      :error="errors.confirmPassword"
      @blur="validateField('confirmPassword')"
    />

    <p v-if="formError" class="rounded bg-red-50 p-2 text-sm text-red-700" role="alert">
      {{ formError }}
    </p>

    <button
      type="submit"
      :disabled="submitting"
      class="w-full rounded bg-indigo-600 py-2 text-white disabled:opacity-50"
    >
      {{ submitting ? 'Creando…' : 'Crear cuenta' }}
    </button>
  </form>
</template>
