<script setup lang="ts">
  import { Gamepad2, LogOut, Menu } from '@lucide/vue'
  import { ref } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  import { appConfig } from '@/shared/config'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import { Button } from '@/shared/ui/components/button'
  import AuthActions from './AuthActions.vue'
  import ThemeMenu from './ThemeMenu.vue'
  import UserChip from './UserChip.vue'

  interface Props {
    /** Layout compacto: sin links de navegación ni acciones de acceso. */
    compact?: boolean
  }

  const props = withDefaults(defineProps<Props>(), { compact: false })

  const auth = useAuthStore()
  const router = useRouter()
  const menuOpen = ref(false)

  async function onLogout() {
    menuOpen.value = false
    await auth.logout()
    await router.push('/')
  }
</script>

<template>
  <header class="border-b border-border bg-background/95">
    <nav class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6" aria-label="Principal">
      <RouterLink
        to="/"
        class="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
        @click="menuOpen = false"
      >
        <span class="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Gamepad2 :size="18" />
        </span>
        {{ appConfig.app.name }}
      </RouterLink>

      <div v-if="!props.compact" class="ml-5 hidden items-center gap-1 md:flex">
        <RouterLink
          to="/games"
          class="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          active-class="bg-muted text-foreground"
          >Juegos</RouterLink
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

      <div class="ml-auto flex items-center gap-1">
        <ThemeMenu />
        <UserChip v-if="auth.hasSession" />
        <AuthActions v-if="!props.compact && !auth.isRegistered" />
        <Button
          v-if="auth.isRegistered"
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar sesión"
          @click="onLogout"
        >
          <LogOut :size="18" />
        </Button>
        <Button
          v-if="!props.compact"
          type="button"
          variant="ghost"
          size="icon"
          class="md:hidden"
          aria-label="Abrir navegación"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <Menu :size="18" />
        </Button>
      </div>
    </nav>

    <div v-if="menuOpen && !props.compact" class="border-t border-border px-4 py-3 md:hidden">
      <div class="mx-auto flex max-w-7xl flex-col gap-1">
        <RouterLink
          to="/games"
          class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
          @click="menuOpen = false"
          >Juegos</RouterLink
        >
        <a
          href="#friends"
          class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
          @click="menuOpen = false"
          >Amigos</a
        >
        <a
          href="#activity"
          class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
          @click="menuOpen = false"
          >Actividad</a
        >
        <RouterLink
          v-if="!auth.isRegistered"
          to="/login"
          class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
          @click="menuOpen = false"
          >Ingresar</RouterLink
        >
        <RouterLink
          v-if="!auth.isRegistered"
          to="/register"
          class="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
          @click="menuOpen = false"
          >Crear cuenta</RouterLink
        >
      </div>
    </div>
  </header>
</template>
