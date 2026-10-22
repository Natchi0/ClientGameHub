<script setup lang="ts">
  import { computed, onBeforeUnmount, watch } from 'vue'
  import { RouterView, useRoute } from 'vue-router'
  import { resolveLayout } from '@/app/layouts'
  import { appConfig } from '@/shared/config'
  import { realtimeClient, useRealtimeConnection } from '@/shared/composables/useRealtimeConnection'

  const route = useRoute()
  const layout = computed(() => resolveLayout(route.meta.layout))

  useRealtimeConnection()

  document.documentElement.lang = appConfig.i18n.defaultLocale

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
  <component :is="layout">
    <RouterView />
  </component>
</template>
