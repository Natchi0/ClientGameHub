<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import BaseInput from '@/shared/ui/BaseInput.vue'
  import { useZodForm } from '@/shared/composables/useZodForm'
  import { useAuthStore } from '../stores/authStore'
  import { loginSchema } from '../schemas'

  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const { values, errors, formError, submitting, validateField, handleSubmit } = useZodForm(
    loginSchema,
    { email: '', password: '' },
  )

  const onSubmit = handleSubmit(async (data) => {
    await auth.login(data)
    const redirect = route.query.redirect
    // solo rutas internas, evita open redirect
    await router.push(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/')
  })
</script>

<template>
  <form class="mx-auto mt-16 max-w-sm space-y-4" novalidate @submit.prevent="onSubmit">
    <h1 class="text-2xl font-bold">Iniciar sesión</h1>

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
      autocomplete="current-password"
      :error="errors.password"
      @blur="validateField('password')"
    />

    <p v-if="formError" class="rounded bg-red-50 p-2 text-sm text-red-700" role="alert">
      {{ formError }}
    </p>

    <button
      type="submit"
      :disabled="submitting"
      class="w-full rounded bg-indigo-600 py-2 text-white disabled:opacity-50"
    >
      {{ submitting ? 'Ingresando…' : 'Ingresar' }}
    </button>

    <RouterLink to="/register" class="block text-center text-sm text-indigo-600">
      ¿No tenés cuenta? Registrate
    </RouterLink>
  </form>
</template>
