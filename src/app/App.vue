<script setup lang="ts">
import { Gamepad2, LogOut, Menu, Moon, Sun } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { appConfig } from '@/shared/config'
import { useTheme } from '@/shared/composables/useTheme'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { Button } from '@/shared/ui/components/button'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { isDark, toggle } = useTheme()
const menuOpen = ref(false)
const isAuthPage = computed(() => route.meta.layout === 'auth')

document.documentElement.lang = appConfig.i18n.defaultLocale

async function onLogout() {
  await auth.logout()
  await router.push('/')
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-background/95">
      <nav class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6" aria-label="Principal">
        <RouterLink to="/" class="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight" @click="closeMenu">
          <span class="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><Gamepad2 :size="18" /></span>
          {{ appConfig.app.name }}
        </RouterLink>

        <div v-if="!isAuthPage" class="ml-5 hidden items-center gap-1 md:flex">
          <RouterLink to="/dashboard" class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" active-class="bg-muted text-foreground">Jugar</RouterLink>
          <a href="#friends" class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Amigos</a>
          <a href="#activity" class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Actividad</a>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'" @click="toggle">
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </Button>

          <template v-if="auth.isRegistered">
            <span class="hidden rounded-md bg-muted px-3 py-1.5 text-sm font-semibold sm:inline">{{ auth.claims?.nickname }}</span>
            <Button type="button" variant="ghost" size="icon" aria-label="Cerrar sesión" @click="onLogout"><LogOut /></Button>
          </template>
          <template v-else>
            <Button as-child variant="ghost" class="hidden sm:inline-flex"><RouterLink to="/login">Ingresar</RouterLink></Button>
            <Button as-child class="hidden sm:inline-flex"><RouterLink to="/register">Crear cuenta</RouterLink></Button>
          </template>
          <Button v-if="!isAuthPage" type="button" variant="ghost" size="icon" class="md:hidden" aria-label="Abrir navegación" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><Menu /></Button>
        </div>
      </nav>
      <div v-if="menuOpen && !isAuthPage" class="border-t border-border px-4 py-3 md:hidden">
        <div class="mx-auto flex max-w-7xl flex-col gap-1">
          <RouterLink to="/dashboard" class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted" @click="closeMenu">Jugar</RouterLink>
          <a href="#friends" class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted" @click="closeMenu">Amigos</a>
          <a href="#activity" class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted" @click="closeMenu">Actividad</a>
          <RouterLink v-if="!auth.isRegistered" to="/login" class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted" @click="closeMenu">Ingresar</RouterLink>
        </div>
      </div>
    </header>

    <main :class="isAuthPage ? 'mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center px-4 py-8 sm:px-6' : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10'">
      <RouterView />
    </main>
  </div>
</template>
