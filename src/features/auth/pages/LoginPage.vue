<script setup lang="ts">
import { ArrowRight, Gamepad2, ShieldCheck } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import BaseInput from '@/shared/ui/BaseInput.vue'
import { Button } from '@/shared/ui/components/button'
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
  await router.push(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/')
})
</script>

<template>
  <div class="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[1fr_.9fr]">
    <section class="p-6 sm:p-10 lg:p-12">
      <div class="max-w-sm">
        <h1 class="text-3xl font-bold tracking-[-0.035em]">Volvé a la partida</h1>
        <p class="mt-3 leading-6 text-muted-foreground">Ingresá para encontrar a tu gente y elegir qué jugar hoy.</p>

        <form class="mt-8 space-y-5" novalidate @submit.prevent="onSubmit">
          <BaseInput v-model="values.email" label="Email" type="email" autocomplete="email" :error="errors.email" @blur="validateField('email')" />
          <BaseInput v-model="values.password" label="Contraseña" type="password" autocomplete="current-password" :error="errors.password" @blur="validateField('password')" />

          <p v-if="formError" class="rounded-md bg-danger-surface px-3 py-2.5 text-sm text-danger" role="alert">{{ formError }}</p>

          <Button type="submit" size="lg" :disabled="submitting" class="w-full">
            {{ submitting ? 'Ingresando…' : 'Ingresar a GameHub' }} <ArrowRight v-if="!submitting" data-icon="inline-end" />
          </Button>
        </form>

        <p class="mt-6 text-sm text-muted-foreground">¿Primera vez por acá? <RouterLink to="/register" class="font-bold text-primary hover:underline">Crear una cuenta</RouterLink></p>
      </div>
    </section>

    <aside class="hidden bg-surface p-10 lg:flex lg:flex-col lg:justify-between">
      <span class="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground"><Gamepad2 :size="24" /></span>
      <div>
        <p class="font-heading text-3xl font-bold leading-tight tracking-[-0.035em]">Más partidas.<br>Menos esperas.</p>
        <div class="mt-6 flex items-center gap-3 text-sm text-muted-foreground"><ShieldCheck :size="18" class="text-primary" /> Tu cuenta y tus partidas, en un solo lugar.</div>
      </div>
    </aside>
  </div>
</template>
