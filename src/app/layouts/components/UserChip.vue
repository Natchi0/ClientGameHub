<script setup lang="ts">
  import { computed } from 'vue'
  import { useAuthStore } from '@/features/auth/stores/authStore'
  import UserAvatar from '@/shared/ui/UserAvatar.vue'

  const auth = useAuthStore()

  const nickname = computed(() => auth.user?.nickname || auth.claims?.nickname || '')
  const avatar = computed(() => auth.user?.avatar ?? null)
</script>

<template>
  <div v-if="nickname" class="flex items-center gap-2 rounded-md px-1.5 py-1">
    <UserAvatar :src="avatar" :name="nickname" />
    <span class="hidden max-w-40 truncate text-sm font-semibold sm:inline">{{ nickname }}</span>
  </div>
</template>
