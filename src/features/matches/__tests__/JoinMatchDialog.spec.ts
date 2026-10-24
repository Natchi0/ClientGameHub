import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JoinMatchDialog from '../components/JoinMatchDialog.vue'
import { matchesApi } from '../api/matchesApi'
import type { GameDto } from '@/features/games/types'
import type { MatchDto } from '../types'
import { MatchStatus, MatchVisibility, ParticipantType } from '../types'

vi.mock('../api/matchesApi', () => ({
  matchesApi: { join: vi.fn<(matchId: number, request: unknown) => Promise<MatchDto>>() },
}))

const mockedJoin = vi.mocked(matchesApi.join)

const game: GameDto = {
  id: 1,
  name: 'connect-four',
  displayName: '4 en línea',
  slug: 'connect-four',
  description: 'd',
  instructions: 'i',
  minPlayers: 2,
  maxPlayers: 4,
  maxDuration: null,
  version: 1,
  gameModule: 'c4',
  hostingMode: 0,
  externalEndpoint: null,
  hidden: false,
  createdAt: '2026-01-01',
  configurations: [],
}

const match: MatchDto = {
  id: 9,
  gameId: 1,
  ownerId: 10,
  isCustomMatch: true,
  status: MatchStatus.Pending,
  visibility: MatchVisibility.Private,
  joinCode: null,
  createdAt: '2026-10-20T18:30:00Z',
  endedAt: null,
  participants: [
    { id: 10, userId: 5, nickname: 'Ana', avatar: null, seat: 1, type: ParticipantType.Player },
    { id: 11, userId: 6, nickname: 'Beto', avatar: null, seat: 2, type: ParticipantType.Player },
  ],
  configurations: [],
}

function mountDialog() {
  const wrapper = mount(JoinMatchDialog, {
    props: { open: true, match, game },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
  return wrapper
}

describe('JoinMatchDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    mockedJoin.mockReset()
  })

  it('se une a una partida privada con contraseña y asiento', async () => {
    mockedJoin.mockResolvedValue({ ...match, joinCode: 'x' } as MatchDto)

    const _wrapper = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()

    const passwordInput = dialogContent!.querySelector('input[type="password"]') as HTMLInputElement
    expect(passwordInput).not.toBeNull()
    passwordInput.value = 'secreto'
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    // El asiento queda preseleccionado al primero disponible (asiento 3).
    const form = dialogContent!.querySelector('form')
    expect(form).not.toBeNull()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).toHaveBeenCalledWith(9, {
      type: ParticipantType.Player,
      seat: 3,
      password: 'secreto',
    })
  })

  it('exige contraseña en partidas privadas', async () => {
    const wrapper = mountDialog()
    await flushPromises()

    const dialogContent = document.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    expect(dialogContent).not.toBeNull()
    const form = dialogContent!.querySelector('form')
    expect(form).not.toBeNull()
    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(mockedJoin).not.toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((wrapper.vm as any).joinError).toBe('Ingresá la contraseña para entrar.')
  })
})
