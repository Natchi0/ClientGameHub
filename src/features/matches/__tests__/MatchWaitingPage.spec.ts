import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MatchWaitingPage from '../pages/MatchWaitingPage.vue'
import { matchesApi } from '../api/matchesApi'
import { gamesApi } from '@/features/games/api/gamesApi'
import type { GameDto } from '@/features/games/types'
import type { MatchDto } from '../types'
import { MatchStatus, MatchVisibility, ParticipantType } from '../types'

vi.mock('../composables/useMatchLobby', () => ({ useMatchLobby: vi.fn<() => () => void>() }))
vi.mock('../api/matchesApi', () => ({
  matchesApi: {
    show: vi.fn<(matchId: number) => Promise<MatchDto>>(),
    leave: vi.fn<(matchId: number) => Promise<MatchDto>>(),
  },
}))
vi.mock('@/features/games/api/gamesApi', () => ({
  gamesApi: {
    show: vi.fn<(gameId: number) => Promise<GameDto>>(),
  },
}))

const mockedShow = vi.mocked(matchesApi.show)
const mockedGameShow = vi.mocked(gamesApi.show)

const game: GameDto = {
  id: 1,
  name: 'connect-four',
  displayName: '4 en línea',
  slug: 'connect-four',
  description: '',
  instructions: '',
  maxDuration: null,
  version: 1,
  minPlayers: 2,
  maxPlayers: 4,
  gameModule: 'c4',
  hostingMode: 0,
  externalEndpoint: null,
  hidden: false,
  createdAt: '2026-01-01',
  configurations: [],
}

function makeMatch(participants: number): MatchDto {
  return {
    id: 7,
    gameId: 1,
    ownerId: participants > 0 ? 100 : null,
    isCustomMatch: true,
    status: MatchStatus.Pending,
    visibility: MatchVisibility.Public,
    joinCode: 'abc123',
    createdAt: '2026-10-20T18:30:00Z',
    endedAt: null,
    participants: Array.from({ length: participants }, (_, index) => ({
      id: 100 + index,
      userId: 200 + index,
      nickname: `Jugador${index}`,
      avatar: null,
      seat: index + 1,
      type: ParticipantType.Player,
    })),
    configurations: [],
  }
}

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/matches', name: 'Matches', component: { template: '<div />' } },
      { path: '/matches/:matchId(\\d+)', name: 'MatchWaiting', component: { template: '<div />' } },
      { path: '/games/:gameId(\\d+)', name: 'GameInfo', component: { template: '<div />' } },
      { path: '/games', name: 'Games', component: { template: '<div />' } },
    ],
  })
  return router
}

async function mountPage() {
  const router = makeRouter()
  await router.push('/matches/7')
  await router.isReady()

  const wrapper = mount(MatchWaitingPage, {
    global: { plugins: [router, createPinia()] },
    attachTo: document.body,
  })
  await flushPromises()
  return { wrapper, router }
}

describe('MatchWaitingPage', () => {
  beforeEach(() => {
    mockedShow.mockReset()
    mockedGameShow.mockReset()
    mockedShow.mockResolvedValue(makeMatch(1))
    mockedGameShow.mockResolvedValue(game)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('muestra un spinner en el progreso mientras no se alcanza el mínimo', async () => {
    const { wrapper } = await mountPage()

    const progreso = wrapper.text().includes('Progreso para iniciar')
    expect(progreso).toBe(true)

    const spinner = wrapper
      .findAll('svg')
      .find((svg) => svg.classes().includes('motion-safe:animate-spin'))
    expect(spinner).toBeDefined()
    // No hay check aún: falta un jugador para el mínimo de 2.
    const check = wrapper
      .findAll('svg')
      .filter((svg) => svg.classes().some((c) => c.startsWith('lucide-check')))
    expect(check).toHaveLength(0)
    expect(wrapper.text()).toContain('Faltan 1 jugadores para el mínimo.')
  })

  it('reemplaza el spinner por un check cuando se alcanza el mínimo', async () => {
    mockedShow.mockResolvedValue(makeMatch(2))
    const { wrapper } = await mountPage()

    const spinner = wrapper
      .findAll('svg')
      .find((svg) => svg.classes().includes('motion-safe:animate-spin'))
    expect(spinner).toBeUndefined()
    expect(wrapper.text()).toContain('El mínimo de jugadores está completo.')
    // El check del mínimo (además del del enlace de invitación copiado, no visible acá).
    const check = wrapper
      .findAll('svg')
      .filter((svg) => svg.classes().some((c) => c.startsWith('lucide-check')))
    expect(check).toHaveLength(1)
  })
})
