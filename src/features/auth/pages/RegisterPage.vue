<script setup lang="ts">
import { ArrowRight, Sparkles, Users } from '@lucide/vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/shared/ui/BaseInput.vue'
import { Button } from '@/shared/ui/components/button'
import { useZodForm } from '@/shared/composables/useZodForm'
import { useAuthStore } from '../stores/authStore'
import { registerSchema } from '../schemas'

const auth = useAuthStore()
const router = useRouter()

const { values, errors, formError, submitting, validateField, handleSubmit } = useZodForm(
  registerSchema,
  { nickname: auth.user?.nickname ?? '', email: '', password: '', confirmPassword: '' },
)

const onSubmit = handleSubmit(async ({ confirmPassword: _confirmPassword, ...payload }) => {
  await auth.register(payload)
  await router.push('/')
})
</script>

<template>
  <div class="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[.9fr_1fr]">
    <aside class="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <span class="grid size-11 place-items-center rounded-md bg-primary-foreground text-primary"><Sparkles :size="23" /></span>
      <div>
        <p class="font-heading text-3xl font-bold leading-tight tracking-[-0.035em]">Tu próxima<br>comunidad te espera.</p>
        <div class="mt-6 flex items-center gap-3 text-sm opacity-85"><Users :size="18" /> Jugá, charlá y armá equipo.</div>
      </div>
    </aside>
    <section class="p-6 sm:p-10 lg:p-12">
      <div class="max-w-sm">
        <h1 class="text-3xl font-bold tracking-[-0.035em]">Creá tu cuenta</h1>
        <p class="mt-3 leading-6 text-muted-foreground">Elegí tu nombre de juego y empezá a encontrar partidas.</p>

        <form class="mt-8 space-y-5" novalidate @submit.prevent="onSubmit">
          <BaseInput v-model="values.nickname" label="Nickname" :error="errors.nickname" @blur="validateField('nickname')" />
          <BaseInput v-model="values.email" label="Email" type="email" autocomplete="email" :error="errors.email" @blur="validateField('email')" />
          <BaseInput v-model="values.password" label="Contraseña" type="password" autocomplete="new-password" :error="errors.password" @blur="validateField('password')" />
          <BaseInput v-model="values.confirmPassword" label="Repetir contraseña" type="password" autocomplete="new-password" :error="errors.confirmPassword" @blur="validateField('confirmPassword')" />

          <p v-if="formError" class="rounded-md bg-danger-surface px-3 py-2.5 text-sm text-danger" role="alert">{{ formError }}</p>

          <Button type="submit" size="lg" :disabled="submitting" class="w-full">
            {{ submitting ? 'Creando…' : 'Crear cuenta' }} <ArrowRight v-if="!submitting" data-icon="inline-end" />
          </Button>
        </form>

        <p class="mt-6 text-sm text-muted-foreground">¿Ya tenés cuenta? <RouterLink to="/login" class="font-bold text-primary hover:underline">Iniciar sesión</RouterLink></p>
      </div>
    </section>
  </div>
</template>
