<script setup lang="ts">
  import { RouterLink, RouterView, useRouter } from 'vue-router'
  import { appConfig } from '@/shared/config'
  import { useTheme } from '@/shared/composables/useTheme'
  import { useAuthStore } from '@/features/auth/stores/authStore'

  const auth = useAuthStore()
  const router = useRouter()
  const { isDark, toggle } = useTheme()

  document.documentElement.lang = appConfig.i18n.defaultLocale // con vue-i18n, enlazar al locale activo

  async function onLogout() {
    await auth.logout()
    await router.push('/')
  }
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-border">
      <nav class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3" aria-label="Principal">
        <RouterLink to="/" class="font-bold">{{ appConfig.app.name }}</RouterLink>

        <div class="ml-auto flex items-center gap-3 text-sm">
          <button type="button" class="text-muted hover:text-foreground" @click="toggle">
            {{ isDark ? 'Modo claro' : 'Modo oscuro' }}
          </button>

          <template v-if="auth.isRegistered">
            <span>{{ auth.claims?.nickname }}</span>
            <button type="button" class="text-primary" @click="onLogout">Salir</button>
          </template>
          <template v-else>
            <span class="text-muted">{{ auth.claims?.nickname }} (invitado)</span>
            <RouterLink to="/login" class="text-primary">Ingresar</RouterLink>
            <RouterLink to="/register" class="text-primary">Registrarse</RouterLink>
          </template>
        </div>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
