import type { RouteRecordRaw } from 'vue-router'

export const matchesRoutes: RouteRecordRaw[] = [
  {
    path: '/matches/:matchId(\\d+)',
    name: 'MatchWaiting',
    component: () => import('./pages/MatchWaitingPage.vue'),
    meta: { title: 'Sala de espera', layout: 'default' },
  },
  {
    path: '/join',
    name: 'JoinMatch',
    component: () => import('./pages/JoinMatchPage.vue'),
    meta: { title: 'Unirse a la partida', layout: 'default' },
  },
]
