import type { RouteRecordRaw } from 'vue-router'

export const gamesRoutes: RouteRecordRaw[] = [
  {
    path: '/games',
    name: 'Games',
    component: () => import('./pages/GamesPage.vue'),
    meta: { title: 'Juegos', layout: 'default' },
  },
  {
    path: '/games/:gameId(\\d+)',
    name: 'GameInfo',
    component: () => import('./pages/GameInfoPage.vue'),
    meta: { title: 'Juego', layout: 'default' },
  },
]
