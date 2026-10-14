import './assets/main.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './app/App.vue'
import router from './app/router/index.ts'
import { useAuthStore } from './features/auth/stores/authStore.ts'
import { setupZod } from './app/plugins/zod.ts'

const app = createApp(App)

app.use(createPinia())
app.use(router)

setupZod()

const auth = useAuthStore()
watch(
  () => auth.isRegistered,
  (registered) => {
    const route = router.currentRoute.value
    if (!registered && route.meta.requiresAccount)
      router.push({ name: 'Login', query: { redirect: route.fullPath } })
  },
)

app.mount('#app')
