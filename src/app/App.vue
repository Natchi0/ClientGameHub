<script setup lang="ts">
  import { Gamepad2, LogOut, Menu, MonitorSmartphone, Moon, Settings, Sun } from '@lucide/vue'
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
  import { appConfig } from '@/shared/config'
  import { useTheme, type ThemePalette } from '@/shared/composables/useTheme'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import { Button } from '@/shared/ui/components/button'
  import { useRealtimeConnection } from '@/shared/composables/useRealtimeConnection'
  import { realtimeClient } from '@/shared/composables/useRealtimeConnection'

  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  const { isDark, mode, setMode, palette, setPalette } = useTheme()
  const menuOpen = ref(false)
  const isAuthPage = computed(() => route.meta.layout === 'auth')

  const palettes: Array<{ value: ThemePalette; label: string; colors: string[] }> = [
    { value: 'green', label: 'Verde', colors: ['#0c6d55', '#a4e85d'] },
    { value: 'blue', label: 'Azul', colors: ['#2563eb', '#60a5fa'] },
    { value: 'orange', label: 'Naranja', colors: ['#d97706', '#f59e0b'] },
    { value: 'violet', label: 'Violeta', colors: ['#7c3aed', '#a78bfa'] },
  ]
  const themeMenuOpen = ref(false)
  function selectPalette(p: ThemePalette) {
    setPalette(p)
  }
  function selectMode(m: 'light' | 'dark' | 'system') {
    setMode(m)
  }

  // El componente raíz administra el ciclo de vida de la conexión.
  useRealtimeConnection()

  document.documentElement.lang = appConfig.i18n.defaultLocale

  async function onLogout() {
    await auth.logout()
    await router.push('/')
  }

  function closeMenu() {
    menuOpen.value = false
    themeMenuOpen.value = false
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('.theme-menu')) {
      themeMenuOpen.value = false
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside)
    }
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', handleClickOutside)
    }
  })

  //suscripción global al hub de notificaciones general
  let unsubscribe: (() => void) | undefined

  const stop = watch(
    realtimeClient,
    (client) => {
      unsubscribe?.()
      unsubscribe = client?.on<[string]>('NotificationReceived', (message) => {
        console.log('Notificación recibida:', message)
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stop()
    unsubscribe?.()
  })
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-background/95">
      <nav
        class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6"
        aria-label="Principal"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
          @click="closeMenu"
        >
          <span class="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"
            ><Gamepad2 :size="18"
          /></span>
          {{ appConfig.app.name }}
        </RouterLink>

        <div v-if="!isAuthPage" class="ml-5 hidden items-center gap-1 md:flex">
          <RouterLink
            to="/dashboard"
            class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            active-class="bg-muted text-foreground"
            >Jugar</RouterLink
          >
          <a
            href="#friends"
            class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >Amigos</a
          >
          <a
            href="#activity"
            class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >Actividad</a
          >
        </div>

        <div class="ml-auto flex items-center gap-2">
          <div class="theme-menu relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Apariencia"
              :aria-expanded="themeMenuOpen"
              @click.stop="themeMenuOpen = !themeMenuOpen"
            >
              <Settings :size="18" />
            </Button>
            <div
              v-if="themeMenuOpen"
              class="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md"
            >
              <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tema</div>
              <div class="flex flex-wrap gap-2 px-2 py-1.5">
                <button
                  v-for="p in palettes"
                  :key="p.value"
                  type="button"
                  class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-border"
                  :class="{
                    'ring-2 ring-ring ring-offset-1 ring-offset-background': palette === p.value,
                  }"
                  :aria-label="p.label"
                  @click.stop="selectPalette(p.value)"
                >
                  <span class="h-full w-1/2" :style="{ backgroundColor: p.colors[0] }" />
                  <span class="h-full w-1/2" :style="{ backgroundColor: p.colors[1] }" />
                </button>
              </div>
              <div class="my-1 h-px bg-border" />
              <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Modo</div>
              <div class="flex gap-1 px-1 py-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :class="{ 'bg-accent text-accent-foreground': mode === 'light' }"
                  @click.stop="selectMode('light')"
                >
                  <Sun :size="18" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :class="{ 'bg-accent text-accent-foreground': mode === 'dark' }"
                  @click.stop="selectMode('dark')"
                >
                  <Moon :size="18" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :class="{ 'bg-accent text-accent-foreground': mode === 'system' }"
                  @click.stop="selectMode('system')"
                >
                  <MonitorSmartphone :size="18" />
                </Button>
                <!-- <Sun
                  :size="18"
                  class="flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  :class="{ 'bg-accent text-accent-foreground': mode === 'light' }"
                  @click.stop="selectMode('light')"
                />
                <Moon
                  :size="18"
                  class="flex w-full h-auto items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  :class="{ 'bg-accent text-accent-foreground': mode === 'dark' }"
                  @click.stop="selectMode('dark')"
                />
                <MonitorSmartphone
                  :size="18"
                  class="flex w-full h-auto items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  :class="{ 'bg-accent text-accent-foreground': mode === 'system' }"
                  @click.stop="selectMode('system')"
                /> -->
              </div>
            </div>
          </div>

          <template v-if="auth.isRegistered">
            <span class="hidden rounded-md bg-muted px-3 py-1.5 text-sm font-semibold sm:inline">{{
              auth.claims?.nickname
            }}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              @click="onLogout"
              ><LogOut
            /></Button>
          </template>
          <template v-else>
            <Button as-child variant="ghost" class="hidden sm:inline-flex"
              ><RouterLink to="/login">Ingresar</RouterLink></Button
            >
            <Button as-child class="hidden sm:inline-flex"
              ><RouterLink to="/register">Crear cuenta</RouterLink></Button
            >
          </template>
          <Button
            v-if="!isAuthPage"
            type="button"
            variant="ghost"
            size="icon"
            class="md:hidden"
            aria-label="Abrir navegación"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
            ><Menu
          /></Button>
        </div>
      </nav>
      <div v-if="menuOpen && !isAuthPage" class="border-t border-border px-4 py-3 md:hidden">
        <div class="mx-auto flex max-w-7xl flex-col gap-1">
          <RouterLink
            to="/dashboard"
            class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
            @click="closeMenu"
            >Jugar</RouterLink
          >
          <a
            href="#friends"
            class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
            @click="closeMenu"
            >Amigos</a
          >
          <a
            href="#activity"
            class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
            @click="closeMenu"
            >Actividad</a
          >
          <RouterLink
            v-if="!auth.isRegistered"
            to="/login"
            class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
            @click="closeMenu"
            >Ingresar</RouterLink
          >
        </div>
      </div>
    </header>

    <main
      :class="
        isAuthPage
          ? 'mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center px-4 py-8 sm:px-6'
          : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10'
      "
    >
      <RouterView />
    </main>
  </div>
</template>
