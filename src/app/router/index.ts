import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '@/features/auth/routes'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { appConfig } from '@/shared/config'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', redirect: '/dashboard' },
    ...authRoutes,
    // Ejemplo de ruta protegida para administradores
    // {
    //   path: '/admin',
    //   name: 'AdminDashboard',
    //   component: () => import('@/features/dashboard/pages/AdminPage.vue'),
    //   meta: { requiresAuth: true, requiredRole: 'Admin' },
    // },
    {
      // Ruta comodín para 404
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFoundPage.vue'),
    },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - ${appConfig.app.name}` : appConfig.app.name
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  try {
    await auth.ensureSession()
  } catch (e) {
    // las rutas con requiresAccount redirigen a login igualmente, se sigue
    console.error('No se pudo asegurar la sesión', e)
  }

  if (to.meta.requiresAccount && !auth.isRegistered)
    return { name: 'Login', query: { redirect: to.fullPath } }

  if (to.meta.guestOnly && auth.isRegistered) return { name: 'home' }

  const role = to.meta.requiredRole as string | undefined
  if (role && !auth.hasRole(role)) return { name: 'home' }
})

export default router
