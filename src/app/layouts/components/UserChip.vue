<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import UserAvatar from '@/shared/ui/UserAvatar.vue'

  const auth = useAuthStore()

  const nickname = computed(() => auth.user?.nickname || auth.claims?.nickname || '')
  const avatar = computed(() => auth.user?.avatar ?? null)
</script>

<template>
  <RouterLink
    v-if="nickname"
    to="/profile"
    class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    active-class="bg-muted text-foreground"
    :aria-label="`Ver el perfil de ${nickname}`"
    :title="nickname"
  >
    <UserAvatar :src="avatar" :name="nickname" />
    <span class="hidden max-w-40 truncate sm:inline">{{ nickname }}</span>
  </RouterLink>
</template>
