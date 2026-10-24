import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JoinMatchPage from '../pages/JoinMatchPage.vue'
import { matchesApi } from '../api/matchesApi'
import {
  MatchStatus,
  MatchVisibility,
  ParticipantType,
  type JoinMatchRequest,
  type MatchDto,
} from '../types'

vi.mock('../api/matchesApi', () => ({
  matchesApi: {
    joinByCode: vi.fn<(joinCode: string, request: JoinMatchRequest) => Promise<MatchDto>>(),
  },
}))

const mockedJoinByCode = vi.mocked(matchesApi.joinByCode)

const joinedMatch: MatchDto = {
  id: 42,
  gameId: 1,
  ownerId: 10,
  isCustomMatch: true,
  status: MatchStatus.Pending,
  visibility: MatchVisibility.Private,
  joinCode: 'invite-code',
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
  ],
  configurations: [],
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/join', name: 'JoinMatch', component: JoinMatchPage },
      { path: '/matches/:matchId', name: 'MatchWaiting', component: { template: '<div />' } },
      { path: '/games', name: 'Games', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(JoinMatchPage, { global: { plugins: [router] } })
  await flushPromises()

  return { wrapper, router }
}

describe('JoinMatchPage', () => {
  beforeEach(() => {
    mockedJoinByCode.mockReset()
  })

  it('joins through the invite code and redirects to the waiting room', async () => {
    mockedJoinByCode.mockResolvedValue(joinedMatch)
    const { router } = await mountAt('/join?code=invite-code')

    expect(mockedJoinByCode).toHaveBeenCalledWith('invite-code', {
      type: ParticipantType.Player,
    })
    expect(router.currentRoute.value.name).toBe('MatchWaiting')
    expect(router.currentRoute.value.params.matchId).toBe('42')
  })

  it('shows an invalid state when the link has no code', async () => {
    const { wrapper } = await mountAt('/join')

    expect(wrapper.text()).toContain('Enlace inválido')
    expect(mockedJoinByCode).not.toHaveBeenCalled()
  })
})
