import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MatchmakingPanel from '../components/MatchmakingPanel.vue'
import { matchesApi } from '../api/matchesApi'
import type { GameDto } from '@/features/games/types'
import type { PagedResult } from '@/shared/types/pagination'
import {
  MatchStatus,
  MatchVisibility,
  ParticipantType,
  type CreateCustomMatchRequest,
  type JoinMatchRequest,
  type MatchDto,
} from '../types'

vi.mock('../api/matchesApi', () => ({
  matchesApi: {
    index: vi.fn<() => Promise<PagedResult<MatchDto>>>(),
    show: vi.fn<(matchId: number) => Promise<MatchDto>>(),
    createCustom: vi.fn<(request: CreateCustomMatchRequest) => Promise<MatchDto>>(),
    join: vi.fn<(matchId: number, request: JoinMatchRequest) => Promise<MatchDto>>(),
    joinByCode: vi.fn<(joinCode: string, request: JoinMatchRequest) => Promise<MatchDto>>(),
    leave: vi.fn<(matchId: number) => Promise<MatchDto>>(),
  },
}))

const mockedIndex = vi.mocked(matchesApi.index)
const mockedJoin = vi.mocked(matchesApi.join)

const game: GameDto = {
  id: 1,
  name: 'connect-four',
  displayName: '4 en línea',
  slug: 'connect-four',
  description: 'Conecta 4 fichas en línea antes que tu oponente.',
  instructions: 'Elegí una columna para soltar tu ficha.',
  minPlayers: 2,
  maxPlayers: 4,
  maxDuration: '00:15:00',
  version: 1,
  gameModule: 'connect-four',
  hostingMode: 0,
  externalEndpoint: null,
  hidden: false,
  createdAt: '2026-01-01T00:00:00Z',
  configurations: [],
}

const privateMatch: MatchDto = {
  id: 7,
  gameId: 1,
  ownerId: 10,
  isCustomMatch: true,
  status: MatchStatus.Pending,
  visibility: MatchVisibility.Private,
  joinCode: null,
  createdAt: '2026-10-20T18:30:00Z',
  endedAt: null,
  participants: [
    {
      id: 10,
      userId: 5,
      nickname: 'Ana',
      avatar: null,
      seat: 1,
      type: ParticipantType.Player,
    },
    {
      id: 11,
      userId: 6,
      nickname: 'Beto',
      avatar: null,
      seat: 2,
      type: ParticipantType.Player,
    },
  ],
  configurations: [],
}

const result: PagedResult<MatchDto> = {
  items: [privateMatch],
  page: 1,
  pageSize: 6,
  totalCount: 1,
  totalPages: 1,
}

async function mountPanel() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games/:gameId', name: 'GameInfo', component: { template: '<div />' } },
      { path: '/matches/:matchId', name: 'MatchWaiting', component: { template: '<div />' } },
      { path: '/join', name: 'JoinMatch', component: { template: '<div />' } },
      { path: '/register', name: 'Register', component: { template: '<div />' } },
    ],
  })
  await router.push('/games/1?tab=matches')
  await router.isReady()

  const wrapper = mount(MatchmakingPanel, {
    props: { game },
    global: { plugins: [router, createPinia()] },
  })
  await flushPromises()

  return { wrapper, router }
}

describe('MatchmakingPanel', () => {
  beforeEach(() => {
    mockedIndex.mockReset()
    mockedJoin.mockReset()
    mockedIndex.mockResolvedValue(result)
  })

  it('lists a private pending match and asks for its password before joining', async () => {
    mockedJoin.mockResolvedValue({ ...privateMatch, joinCode: 'invite-code' })
    const { wrapper, router } = await mountPanel()

    expect(wrapper.text()).toContain('Partidas abiertas')
    expect(wrapper.text()).toContain('Ana')
    expect(wrapper.text()).toContain('Privada')
    expect(wrapper.text()).toContain('Se necesita la contraseña')

    const joinButton = wrapper.findAll('button').find((button) => button.text() === 'Unirse')
    expect(joinButton).toBeDefined()
    await joinButton!.trigger('click')

    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)
    await passwordInput.setValue('secret')

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'Confirmar')
    expect(confirmButton).toBeDefined()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedJoin).toHaveBeenCalledWith(7, {
      type: ParticipantType.Player,
      seat: 3,
      password: 'secret',
    })
    expect(router.currentRoute.value.name).toBe('MatchWaiting')
  })

  it('shows the empty state when there are no pending matches', async () => {
    mockedIndex.mockResolvedValue({ ...result, items: [], totalCount: 0, totalPages: 0 })
    const { wrapper } = await mountPanel()

    expect(wrapper.text()).toContain('No hay partidas esperando jugadores')
  })
})
