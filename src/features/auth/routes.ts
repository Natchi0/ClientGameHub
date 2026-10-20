import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/LoginPage.vue'),
    meta: { guestOnly: true, title: 'Iniciar sesión', layout: 'auth' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('./pages/RegisterPage.vue'),
    meta: { guestOnly: true, title: 'Crear cuenta', layout: 'auth' },
  },
]
