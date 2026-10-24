import { flushPromises, mount } from '@vue/test-utils'
import { AxiosError, type AxiosResponse } from 'axios'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GameInfoPage from '../pages/GameInfoPage.vue'
import { gamesApi } from '../api/gamesApi'
import { matchesApi } from '@/features/matches/api/matchesApi'
import type { PagedResult } from '@/shared/types/pagination'
import type { CreateCustomMatchRequest, JoinMatchRequest, MatchDto } from '@/features/matches/types'
import type { GameDto } from '../types'

vi.mock('../api/gamesApi', () => ({
  gamesApi: {
    index: vi.fn<() => Promise<GameDto[]>>(),
    show: vi.fn<(gameId: number) => Promise<GameDto>>(),
  },
}))

vi.mock('@/features/matches/api/matchesApi', () => ({
  matchesApi: {
    index: vi.fn<() => Promise<PagedResult<MatchDto>>>(),
    show: vi.fn<(matchId: number) => Promise<MatchDto>>(),
    createCustom: vi.fn<(request: CreateCustomMatchRequest) => Promise<MatchDto>>(),
    join: vi.fn<(matchId: number, request: JoinMatchRequest) => Promise<MatchDto>>(),
    joinByCode: vi.fn<(joinCode: string, request: JoinMatchRequest) => Promise<MatchDto>>(),
    leave: vi.fn<(matchId: number) => Promise<MatchDto>>(),
  },
}))

const mockedShow = vi.mocked(gamesApi.show)
const mockedMatchesIndex = vi.mocked(matchesApi.index)

const connectFour: GameDto = {
  id: 1,
  name: 'connect-four',
  displayName: '4 en línea',
  slug: 'connect-four',
  description: 'Conecta 4 fichas en línea antes que tu oponente.',
  instructions: 'Elegí una columna para soltar tu ficha.\n\nGana quien conecte 4 en línea.',
  minPlayers: 2,
  maxPlayers: 2,
  maxDuration: '00:15:00',
  version: 1,
  gameModule: 'connect-four',
  hostingMode: 0,
  externalEndpoint: null,
  hidden: false,
  createdAt: '2026-01-01T00:00:00Z',
  configurations: [
    {
      id: 3,
      configId: 2,
      name: 'board-theme',
      displayName: 'Tema del tablero',
      description: null,
      required: false,
      defaultValue: null,
      dataType: 3,
      options: [{ id: 10, name: 'classic', displayName: 'Clásico', description: null }],
    },
  ],
}

function apiError(status: number): AxiosError {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    statusText: '',
    data: null,
    headers: {},
    config: { headers: {} } as never,
  } as AxiosResponse
  return error
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games', name: 'Games', component: { template: '<div />' } },
      { path: '/games/:gameId(\\d+)', name: 'GameInfo', component: GameInfoPage },
      { path: '/matches', name: 'Matches', component: { template: '<div />' } },
    ],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(GameInfoPage, {
    global: { plugins: [router, createPinia()] },
  })
  await flushPromises()

  return { wrapper, router }
}

describe('GameInfoPage', () => {
  beforeEach(() => {
    mockedShow.mockReset()
    mockedMatchesIndex.mockReset()
    mockedMatchesIndex.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 6,
      totalCount: 0,
      totalPages: 0,
    })
  })

  it('renders the general information of the game', async () => {
    mockedShow.mockResolvedValue(connectFour)

    const { wrapper } = await mountAt('/games/1')

    expect(wrapper.get('h1').text()).toBe('4 en línea')
    expect(wrapper.text()).toContain('Conecta 4 fichas')
    expect(wrapper.text()).toContain('2 jugadores')
    expect(wrapper.text()).toContain('15 min')
    expect(wrapper.text()).toContain('Tema del tablero')
    expect(mockedShow).toHaveBeenCalledWith(1)
  })

  it('el botón buscar partida navega al listado de partidas del juego', async () => {
    mockedShow.mockResolvedValue(connectFour)

    const { wrapper, router } = await mountAt('/games/1')

    expect(wrapper.text()).toContain('Información')
    expect(wrapper.text()).toContain('Reglas')

    const buscar = wrapper.findAll('a, button').find((el) => el.text() === 'Buscar partida')
    expect(buscar).toBeDefined()
    await buscar!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('Matches')
    expect(router.currentRoute.value.query.gameId).toBe('1')
  })

  it('el botón crear partida abre el diálogo con el juego preseleccionado y navega a la pestaña Partidas', async () => {
    mockedShow.mockResolvedValue(connectFour)

    const { wrapper, router } = await mountAt('/games/1')

    const crear = wrapper.findAll('a, button').find((el) => el.text() === 'Crear partida')
    expect(crear).toBeDefined()
    await crear!.trigger('click')
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    expect(dialogContent!.textContent).toContain('Crear partida')

    // el listado se queda montado en la pestaña de partidas del juego
    expect(router.currentRoute.value.name).not.toBe('Matches')
    expect(router.currentRoute.value.query.tab).toBe('matches')
  })

  it('en la pestaña Partidas el botón crear partida abre el diálogo sin navegar', async () => {
    mockedShow.mockResolvedValue(connectFour)

    const { wrapper, router } = await mountAt('/games/1?tab=matches')

    const crear = wrapper.findAll('a, button').find((el) => el.text() === 'Crear partida')
    expect(crear).toBeDefined()
    await crear!.trigger('click')
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    expect(router.currentRoute.value.query.tab).toBe('matches')
  })

  it('shows the not-found state for a missing game', async () => {
    mockedShow.mockRejectedValue(apiError(404))

    const { wrapper } = await mountAt('/games/99')

    expect(wrapper.text()).toContain('Juego no encontrado')
    expect(wrapper.text()).toContain('Volver al catálogo')
  })

  it('shows an error and retries the request', async () => {
    mockedShow.mockRejectedValueOnce(apiError(500))

    const { wrapper } = await mountAt('/games/1')

    expect(wrapper.text()).toContain('No pudimos cargar el juego')

    mockedShow.mockResolvedValueOnce(connectFour)
    const retry = wrapper.findAll('button').find((button) => button.text().includes('Reintentar'))
    if (!retry) throw new Error('Retry button was not rendered')
    await retry.trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('4 en línea')
  })
})
